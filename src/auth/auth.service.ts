import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../modules/auth/entities/user.entity';
import { CreateUserDto } from '../modules/auth/dto/create-user.dto';
import { LoginDto } from '../modules/auth/dto/login.dto';
import { UpdateProfileDto } from  '../modules/auth/dto/update-profile.dto';
import { EmailService } from '../auth/email/email.service'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async createUser(createUserDto: CreateUserDto, createdBy: User): Promise<User> {
    // Only super admins can create users
    if (createdBy.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admins can create users');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.ADMIN,
      status: UserStatus.PENDING,
      is_first_login: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(savedUser.email, tempPassword, savedUser.first_name);

    return savedUser;
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email }
    });

    if (!user || (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING)) {
      throw new UnauthorizedException('Invalid credentials or account not active');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if( user.is_first_login) {
        await this.userRepository.update(user.id, {
            is_first_login: false,
            status: UserStatus.ACTIVE,
    });
    }

    // Update last login
    await this.userRepository.update(user.id, { last_login_at: new Date() });

    const payload = { sub: user.id, email: user.email, role: user.role, status: user.status };
    const access_token = this.jwtService.sign(payload);

    const { password, ...userWithoutPassword } = user;
    
    return {
      access_token,
      user: userWithoutPassword
    };
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = { ...updateProfileDto };

    // If password is being updated
    if (updateProfileDto.password) {
      updateData.password = await bcrypt.hash(updateProfileDto.password, 10);
      updateData.is_first_login = false;
      updateData.status = UserStatus.ACTIVE;
    }

    const { currentPassword, newPassword, confirmPassword, ...profileData } = updateData;
    await this.userRepository.update(userId, profileData);
    
    const updatedUser = await this.userRepository.findOne({ where: { id: userId } });

    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  async findAll(currentUserId:number): Promise<Partial<User>[]> {
    const users = await this.userRepository.find({
      select: ['id', 'email', 'first_name', 'last_name', 'role', 'status', 'last_login_at', 'created_at'],
        where: { id: Not(currentUserId) }, // Exclude the current user
    });
    
    return users;
  }

  private generateTempPassword(): string {
    return Math.random().toString(36).slice(-12);
  }
}