import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';

export type SafeUser = Omit<User, 'passwordHash'> & { id: string };

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');
    const password = this.configService.get<string>('DEFAULT_ADMIN_PASSWORD');
    const name = this.configService.get<string>('DEFAULT_ADMIN_NAME', 'Admin');
    if (!email || !password) {
      return;
    }
    const existing = await this.userModel.findOne({ email });
    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 10);
      await this.userModel.create({
        email,
        name,
        passwordHash,
        role: 'admin',
      });
      // eslint-disable-next-line no-console
      console.log(`Usuário padrão criado: ${email}`);
    }
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email,
      name: dto.name,
      role: dto.role ?? 'user',
      passwordHash,
    });
    return this.toSafeUser(user);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userModel.find().lean();
    return users.map((user: any) => this.toSafeUser(user));
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return this.toSafeUser(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;
    if (dto.role) user.role = dto.role;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    await user.save();
    return this.toSafeUser(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      return null;
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }
    return this.toSafeUser(user);
  }

  toSafeUser(user: User | any): SafeUser {
    const plain = user.toObject ? user.toObject() : user;
    const { _id, passwordHash, __v, ...rest } = plain;
    return { id: _id?.toString() ?? user.id ?? user._id?.toString(), ...rest };
  }
}

