export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  image?: string;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface UserResume {
  id: string;
  username: string;
  name: string;
  email: string;
  image?: string;
  active: boolean;
}

export interface Role {
  id: string;
  name: string;
  label: string;
  description: string;
  permissions?: string[];
}

export interface Permission {
  id: string;
  name: string;
  label: string;
  description: string;
}
