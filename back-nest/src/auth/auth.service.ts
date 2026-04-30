import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CategoriesService } from '../categories/categories.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private categoriesService: CategoriesService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Create new user
    const user = new this.userModel({
      name,
      email: email.toLowerCase(),
      password,
    });

    await user.save();

    // Create default categories for the user
    await this.categoriesService.createDefaultCategories(user._id.toString());

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find user and check if refresh token exists
      const user = await this.userModel.findById(payload.sub);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        throw new UnauthorizedException('Token de rafraîchissement invalide');
      }

      // Remove old refresh token
      await user.removeRefreshToken(refreshToken);

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  async logout(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId);
    if (user) {
      await user.removeRefreshToken(refreshToken);
    }
    return { message: 'Déconnexion réussie' };
  }

  async logoutAll(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokens: [] });
    return { message: 'Déconnecté de tous les appareils' };
  }

  private async generateTokens(user: UserDocument) {
    const payload = { sub: user._id.toString(), email: user.email };

    const accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiration as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiration as any,
    });

    // Save refresh token
    await user.addRefreshToken(refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser(user: UserDocument) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
    };
  }
}
