import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Mail, User } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/atomic-components/avatar";
import {
  RolesProvider,
  useRoles,
} from "@/features/users/providers/RolesProvider";
import { Label } from "@/core/atomic-components/label";
import { Badge } from "@/core/atomic-components/badge";
import { useUser } from "@/features/auth/providers/UserProvider";
import logo from "@/assets/react.svg";
import { ProfileNameForm } from "@/features/auth/components/profile/ProfileNameForm";
import { ChangePasswordModal } from "@/features/auth/components/profile/modal/ChangePasswordModal";
// import { ProfileImageUploadModal } from "@/features/auth/components/profile/modal/ProfileImageUploadModal";
import { OpenChangePasswordModalBtn } from "@/features/auth/components/profile/actions-buttons/OpenChangePasswordModalBtn";

const ProfilePage = () => {
  const { user } = useUser();
  const { roles: allRoles } = useRoles();
  // const [imageModalOpen, setImageModalOpen] = useState(false);
  const userRoles = allRoles.filter((role) => user.roles.includes(role.name));

  // const handleImageChange = (newImage: string) => {
  //   setImageModalOpen(false);
  // };

  return (
    <div className="flex justify-center bg-background animate-in fade-in-0">
      <div className="container max-w-4xl px-4 py-6 md:py-10 md:px-6">
        <Card className="relative overflow-hidden shadow-xl bg-sidebar">
          {/* Background Header */}
          <div className="absolute top-0 left-0 right-0 h-24 md:h-28 bg-gradient-to-r from-primary/100 to-primary/90 dark:from-primary-900/90 dark:to-primary-900/80" />
          <img
            src={logo}
            alt="Logo"
            className="absolute h-24 right-6 top-8 md:h-12"
          />
          <CardHeader className="relative pt-8 md:pt-32">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
              {/* Avatar Section */}
              <div className="relative md:absolute md:top-16 group">
                <Avatar className="w-24 h-24 shadow-xl md:w-32 md:h-32">
                  <AvatarImage src={user.image} />
                  <AvatarFallback>
                    <span className="text-3xl">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </AvatarFallback>
                </Avatar>
                {/* <button
                  onClick={() => setImageModalOpen(true)}
                  className="absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 bg-black/60 group-hover:opacity-100"
                >
                  <Pencil className="w-6 h-6 text-white" />
                </button> */}
              </div>

              {/* User Info Section */}
              <div className="flex-1 space-y-2 text-center md:text-left">
                <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <CardTitle>
                      <ProfileNameForm />
                    </CardTitle>
                    <CardDescription className="flex flex-col gap-4 text-sm md:ml-40 md:text-base">
                      {user.username}
                      <OpenChangePasswordModalBtn />
                    </CardDescription>
                  </div>
                  {user.roles.includes("admin") && (
                    <Badge className="font-bold uppercase">Admin</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 space-y-8 md:px-6">
            {/* Información de contacto */}
            <div className="grid gap-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Información de contacto
                </Label>
                <div className="grid gap-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Email:
                      </span>
                    </div>
                    <span className="text-sm break-all sm:text-base">
                      {user?.email}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Usuario:
                      </span>
                    </div>
                    <span className="text-sm sm:text-base">
                      @{user?.username}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de la cuenta */}
            <div className="grid gap-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Información de la cuenta
                </Label>
                <div className="grid gap-6 sm:gap-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Miembro desde:
                      </span>
                    </div>
                    <span className="text-sm sm:text-base">
                      {format(
                        new Date(user.createdAt),
                        "d 'de' MMMM 'de' yyyy",
                        { locale: es }
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Última actualización:
                      </span>
                    </div>
                    <span className="text-sm sm:text-base">
                      {format(
                        new Date(user.updatedAt),
                        "d 'de' MMMM 'de' yyyy",
                        { locale: es }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Roles</Label>
                <div className="grid gap-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <span className="flex gap-2 text-sm break-all sm:text-base">
                      {userRoles.length > 0 &&
                        userRoles.map((role) => (
                          <Badge key={role.name}>{role.label}</Badge>
                        ))}
                      {userRoles.length === 0 && <Badge>Usuario</Badge>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* <ProfileImageUploadModal
        currentImage={user?.image}
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        onImageChange={handleImageChange}
      /> */}

      <ChangePasswordModal />
    </div>
  );
};

const ProfilePageWithRoles = () => {
  return <RolesProvider>{<ProfilePage />}</RolesProvider>;
};

export default ProfilePageWithRoles;
