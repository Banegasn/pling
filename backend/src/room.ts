export class Room {

  id: string;
  users: string[];

  constructor(id: string) {
    this.id = id;
    this.users = [];
  }

  addUser(id: string): Room {
    if (!this.users.includes(id)) {
      this.users.push(id);
    }
    return this;
  }

  deleteUser(id: string): Room {
    this.users = this.users.filter(user => user === id);
    return this;
  }

  roomies(id: string): string[] {
    return this.users.filter(user => user === id);
  }
}
