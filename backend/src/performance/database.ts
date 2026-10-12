import { databaseName } from "./scope";

export interface AdminConnection { query(sql: string): Promise<unknown>; }
export class OwnedDatabase {
  readonly name: string;
  private owned = false;
  constructor(runId: string, private readonly admin: AdminConnection) { this.name = databaseName(runId); }
  async create(): Promise<void> {
    await this.admin.query(`CREATE DATABASE "${this.name}"`);
    this.owned = true;
  }
  async drop(): Promise<void> {
    if (!this.owned) return;
    await this.admin.query(`DROP DATABASE "${this.name}" WITH (FORCE)`);
    this.owned = false;
  }
}
