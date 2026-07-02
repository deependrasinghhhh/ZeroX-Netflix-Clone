import { Injectable } from "@nestjs/common";
import { UserRepository } from "./users.repository";
import { User, Prisma } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.userRepository.create(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.userRepository.update(id, data);
  }

  async softDelete(id: string): Promise<User> {
    return this.userRepository.softDelete(id);
  }
}
