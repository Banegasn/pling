import { User } from "./user";

export class Room {

  readonly id: string;
  private _users: Map<string, User>;

  constructor(id: string) {
    this.id = id;
    this._users = new Map();
  }

  addUser(id: string, user: User ): Room {
    this._users.set(id, user);
    return this;
  }

  deleteUser(id: string): Room {
    this._users.delete(id);
    return this;
  }

  roomies(id: string): User[] {
    return this.users.filter(user => user.id !== id);
  }

  get users() {
    return Array.from(this._users.values());
  }
}
