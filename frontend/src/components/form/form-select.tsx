"use client"

import * as React from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import {
  Label,
  ListBox,
  ListBoxItem,
  Select,
} from "@heroui/react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type FormSelectOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

type FormSelectProps<TForm extends FieldValues> = {
  control: Control<TForm>
  name: FieldPath<TForm>
  label: string
  options: FormSelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

const TRIGGER_BASE =
  "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground data-[invalid=true]:border-destructive aria-invalid:border-destructive"

const POPOVER_BASE =
  "z-50 max-h-72 min-w-[var(--trigger-width)] overflow-auto rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-md"

const ITEM_BASE =
  "flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"

export function FormSelect<TForm extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Select…",
  disabled,
  className,
}: FormSelectProps<TForm>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const stringValue = field.value === undefined || field.value === null ? "" : String(field.value)
        const selected = options.find((opt) => opt.value === stringValue)
        return (
          <Select
            selectedKey={stringValue || null}
            onSelectionChange={(key) => field.onChange(key === null ? "" : String(key))}
            isInvalid={!!fieldState.error}
            isDisabled={disabled}
            className={cn("flex flex-col gap-1", className)}
          >
            <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
            <Select.Trigger className={TRIGGER_BASE} aria-invalid={!!fieldState.error}>
              <Select.Value className="truncate">
                {selected ? selected.label : <span className="text-muted-foreground">{placeholder}</span>}
              </Select.Value>
              <Select.Indicator>
                <ChevronDownIcon className="size-4 opacity-60" />
              </Select.Indicator>
            </Select.Trigger>
            <Select.Popover className={POPOVER_BASE}>
              <ListBox>
                {options.map((opt) => (
                  <ListBoxItem
                    key={opt.value}
                    id={opt.value}
                    isDisabled={opt.disabled}
                    textValue={opt.label}
                    className={ITEM_BASE}
                  >
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      {opt.description ? (
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      ) : null}
                    </div>
                  </ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
            {fieldState.error ? (
              <span className="text-xs text-destructive">{fieldState.error.message}</span>
            ) : null}
          </Select>
        )
      }}
    />
  )
}
