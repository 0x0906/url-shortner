import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Url } from "./Url";

@Entity("visits")
export class Visit {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "url_id", type: "varchar" })
  urlId!: string;

  @Column({ name: "ip_address", type: "varchar", nullable: true })
  ipAddress!: string | null;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: "visited_at", type: "timestamptz" })
  visitedAt!: Date;

  @ManyToOne(() => Url, (url) => url.visits, { onDelete: "CASCADE" })
  @JoinColumn({ name: "url_id" })
  url!: Url;
}
