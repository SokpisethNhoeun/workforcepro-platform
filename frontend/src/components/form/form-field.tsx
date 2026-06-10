"use client"

import * as React from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { Input, Label, TextField } from "@heroui/react"

import { cn } from "@/lib/utils"

type FormFieldProps<TForm extends FieldValues> = {
  control: Control<TForm>
  name: FieldPath<TForm>
  label: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
  disabled?: boolean
  description?: string
  className?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  autoComplete?: string
}

const INPUT_BASE =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/30"

export function FormField<TForm extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  disabled,
  description,
  className,
  inputMode,
  autoComplete,
}: FormFieldProps<TForm>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          isInvalid={!!fieldState.error}
          isDisabled={disabled}
          className={cn("flex flex-col gap-1", className)}
        >
          <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
          <Input
            type={type}
            name={field.name}
            ref={field.ref}
            placeholder={placeholder}
            inputMode={inputMode}
            autoComplete={autoComplete}
            className={INPUT_BASE}
          />
          {description && !fieldState.error ? (
            <span className="text-xs text-muted-foreground">{description}</span>
          ) : null}
          {fieldState.error ? (
            <span className="text-xs text-destructive">{fieldState.error.message}</span>
          ) : null}
        </TextField>
      )}
    />
  )
}

export const formInputClass = INPUT_BASE
