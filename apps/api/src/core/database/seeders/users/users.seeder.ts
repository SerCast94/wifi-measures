import { Injectable } from "@nestjs/common";

import { permissions } from "./permissions";
import { adminUser } from "./users";
import { seederAdminRole, seederRoles } from "./roles";
import { LoggerService } from "@core/logger/logger.service";
import { DatabaseService } from "@core/database/database.service";
import { PasswordService } from "@core/passwords/password.service";

@Injectable()
export class UsersSeeder {
  private context = "[USERS SEEDEER]";
  private name = "users-seeder";

  constructor(
    private readonly logger: LoggerService,
    private readonly database: DatabaseService,
    private readonly passwordService: PasswordService
  ) {}

  async seed() {
    try {
      const db = this.database.getClient();
      if (!db) {
        this.logger.warn(
          this.context,
          "Database client not available. Skipping seed."
        );
        return;
      }

      // Comprobar si el seeder se ha ejecutado previamente
      const seeder = await db.seeder.findFirst({
        where: {
          name: this.name,
        },
      });

      if (seeder) {
        this.logger.log(
          this.context,
          `Seeder [${this.name}] already executed!`
        );
        return;
      }

      this.logger.log(
        this.context,
        `Initializing [${this.name}] seed process...`
      );

      await db.$transaction(async (tx: any) => {
        this.logger.log(this.context, "Seeding PERMISSIONS...");
        // Flush the database Permissions, Roles, Users and UserRoles before seeding
        await tx.userRole.deleteMany({});
        await tx.rolePermission.deleteMany({});
        await tx.role.deleteMany({});
        await tx.permission.deleteMany({});
        await tx.user.deleteMany({});

        for (const permission of permissions) {
          // Check if permission already exists
          const existingPermission = await tx.permission.findFirst({
            where: {
              name: permission.name,
            },
          });

          if (!existingPermission) {
            await tx.permission.create({
              data: permission,
            });
          }
        }
        this.logger.log(this.context, "PERMISSIONS seeded successfully!");

        this.logger.log(this.context, "Seeding ROLES...");

        // Create admin role
        let adminRole = await tx.role.findFirst({
          where: {
            name: seederAdminRole.name,
          },
        });

        if (!adminRole) {
          adminRole = await tx.role.create({
            data: {
              name: seederAdminRole.name,
              label: seederAdminRole.label,
              description: seederAdminRole.description,
            },
          });
        }

        const allPermissions = await tx.permission.findMany();

        // Create admin role permissions
        const adminRolePermissions = allPermissions.map((permission: any) => ({
          roleId: adminRole.id,
          permissionId: permission.id,
        }));

        await tx.rolePermission.createMany({
          data: adminRolePermissions,
        });

        seederRoles.forEach(async (role: any) => {
          let existingRole = await tx.role.findFirst({
            where: {
              name: role.name,
            },
          });

          const roleWithoutPermissions = {
            name: role.name,
            label: role.label,
            description: role.description,
          };

          if (!existingRole) {
            existingRole = await tx.role.create({
              data: roleWithoutPermissions,
            });
          }

          const roleId = existingRole.id;
          await tx.rolePermission.deleteMany({
            where: { roleId },
          });

          const allPermissions = await tx.permission.findMany();

          const rolePermissions = allPermissions
            .filter((permission: any) =>
              role.permissions?.includes(permission.name)
            )
            .map((permission: any) => ({
              roleId,
              permissionId: permission.id,
            }));

          if (rolePermissions.length > 0) {
            await tx.rolePermission.createMany({
              data: rolePermissions,
            });
          }
        });

        this.logger.log(this.context, "ROLES seeded successfully!!");

        this.logger.log(this.context, "Seeding USERS...");

        // Get the admin role
        const existingRole = await tx.role.findFirst({
          where: {
            name: "admin",
          },
        });

        if (!existingRole) {
          this.logger.error(
            this.context,
            "Admin role not found! Please make sure the roles seeder has been executed."
          );
          return;
        }

        // Check if the admin user already exists
        let adminExistingUser = await tx.user.findFirst({
          where: {
            username: adminUser.username,
          },
        });

        if (!adminExistingUser) {
          // Create the user
          adminExistingUser = await tx.user.create({
            data: {
              ...adminUser,
              password: await this.passwordService.hashPassword(
                adminUser.password
              ),
            },
          });
        }
        // Assign the admin role to the admin user
        await tx.userRole.create({
          data: {
            userId: adminExistingUser.id,
            roleId: existingRole.id,
          },
        });

        this.logger.log(this.context, "USERS seeded successfully!");

        // Mark the seeder as executed
        await tx.seeder.create({
          data: {
            name: this.name,
          },
        });
        this.logger.log(this.context, `[${this.name}] executed successfully!`);
      });
    } catch (error) {
      this.logger.error(this.context, error.message, error.stack);
    }
  }
}
