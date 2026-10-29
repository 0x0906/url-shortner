import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Url } from "./Url";
import { Session } from "./Session";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "varchar" })
  passwordHash!: string;

  @Column({ name: "is_verified", type: "boolean", default: false })
  isVerified!: boolean;

  @Column({ name: "verification_token", type: "varchar", unique: true, nullable: true })
  verificationToken!: string | null;

  @Column({ name: "reset_token", type: "varchar", unique: true, nullable: true })
  resetToken!: string | null;

  @Column({ name: "reset_token_expires", type: "timestamptz", nullable: true })
  resetTokenExpires!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => Url, (url) => url.user)
  urls!: Url[];

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];
}
