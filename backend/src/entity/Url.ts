import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./User";
import { Visit } from "./Visit";

@Entity("urls")
export class Url {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "original_url", type: "text" })
  originalUrl!: string;

  @Column({ name: "short_code", type: "varchar", unique: true })
  shortCode!: string;

  @Column({ name: "custom_alias", type: "varchar", unique: true, nullable: true })
  customAlias!: string | null;

  @Column({ name: "click_count", type: "integer", default: 0 })
  clickCount!: number;

  @Column({ name: "expires_at", type: "timestamptz", nullable: true })
  expiresAt!: Date | null;

  @Column({ name: "password_hash", type: "varchar", nullable: true })
  passwordHash!: string | null;

  @Column({ name: "is_one_time", type: "boolean", default: false })
  isOneTime!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "user_id", type: "varchar", nullable: true })
  userId!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.urls, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @OneToMany(() => Visit, (visit) => visit.url, { cascade: true })
  visits!: Visit[];
}
