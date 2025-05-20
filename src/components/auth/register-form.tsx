"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert"; // AlertTitle removed as it's not used
import { User, Mail, Lock, Building, UsersRound, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Assuming this is src/hooks/use-toast.ts

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, introduce una dirección de correo electrónico válida.",
  }),
  password: z.string().min(10, {
    message: "La contraseña debe tener al menos 10 caracteres.",
  }).max(15, {
    message: "La contraseña debe tener como máximo 15 caracteres.",
  }).regex(/[A-Z]/, {
    message: "La contraseña debe contener al menos una letra mayúscula.",
  }).regex(/[a-z]/, {
    message: "La contraseña debe contener al menos una letra minúscula.",
  }).regex(/[^A-Za-z0-9]/, {
    message: "La contraseña debe contener al menos un carácter especial.",
  }),
  confirmPassword: z.string(),
  institution: z.string().min(2, {
    message: "La institución debe tener al menos 2 caracteres.",
  }),
  role: z.enum(["administrator", "teacher", "student"], {
    required_error: "Debes seleccionar un rol.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

export function RegisterForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      institution: "",
      role: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Registro Enviado",
      description: "Tus datos de registro han sido recibidos.",
    });
    // Aquí se manejaría la lógica de registro real
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Juan Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Correo Electrónico</FormLabel>
              <FormControl>
                <Input placeholder="juan.perez@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••••" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                La contraseña debe tener entre 10 y 15 caracteres, con una mayúscula, una minúscula y un carácter especial.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Confirmar Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="institution"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground" />Institución</FormLabel>
              <FormControl>
                <Input placeholder="Universidad de Ejemplo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="flex items-center"><UsersRound className="mr-2 h-4 w-4 text-muted-foreground" />Rol</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="administrator" />
                    </FormControl>
                    <FormLabel className="font-normal">Administrador</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="teacher" />
                    </FormControl>
                    <FormLabel className="font-normal">Profesor</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="student" />
                    </FormControl>
                    <FormLabel className="font-normal">Estudiante</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Alert className="bg-[hsl(var(--input-bg))] border-[hsl(var(--input-border))]">
          <Info className="h-4 w-4 text-muted-foreground" />
          <AlertDescription className="text-muted-foreground text-xs">
            Por favor, completa todos los campos del formulario con información verídica.
          </AlertDescription>
        </Alert>

        <Button type="submit" className="w-full" size="lg">Registrarse</Button>
      </form>
    </Form>
  );
}
