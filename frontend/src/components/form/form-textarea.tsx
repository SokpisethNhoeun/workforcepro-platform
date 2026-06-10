"use client"

import * as React from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { Label, TextArea, TextField } from "@heroui/react"

import { cn } from "@/lib/utils"

type FormTextareaProps<TForm extends FieldValues> = {
  control: Control<TForm>
  name: FieldPath<TForm>
  label: string
  placeholder?: string
  disabled?: boolean
  rows?: number
  className?: string
}

const TEXTAREA_BASE =
  "min-h-[88px] w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/30"

export function FormTextarea<TForm extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
  rows = 3,
  className,
}: FormTextareaProps<TForm>) {
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
          <TextArea
            name={field.name}
            ref={field.ref}
            placeholder={placeholder}
            rows={rows}
            className={TEXTAREA_BASE}
          />
          {fieldState.error ? (
            <span className="text-xs text-destructive">{fieldState.error.message}</span>
          ) : null}
        </TextField>
      )}
    />
  )
}
