"use client"

import * as React from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import {
  Autocomplete,
  Input,
  Label,
  ListBox,
  ListBoxItem,
} from "@heroui/react"
import { ChevronDownIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type FormComboboxOption = {
  value: string
  label: string
  description?: string
}

type FormComboboxProps<TForm extends FieldValues> = {
  control: Control<TForm>
  name: FieldPath<TForm>
  label: string
  options: FormComboboxOption[]
  placeholder?: string
  emptyMessage?: string
  loading?: boolean
  disabled?: boolean
  className?: string
}

const TRIGGER_BASE =
  "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition-colors hover:bg-accent/40 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 aria-invalid:border-destructive"

const POPOVER_BASE =
  "z-50 w-[var(--trigger-width)] overflow-hidden rounded-md border bg-popover text-sm text-popover-foreground shadow-md"

const SEARCH_BASE =
  "h-9 w-full border-b bg-card px-3 text-sm outline-none placeholder:text-muted-foreground"

const ITEM_BASE =
  "flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"

export function FormCombobox<TForm extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Select…",
  emptyMessage = "No matches",
  loading,
  disabled,
  className,
}: FormComboboxProps<TForm>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const stringValue =
          field.value === undefined || field.value === null || field.value === "" ? "" : String(field.value)
        const selected = options.find((opt) => opt.value === stringValue)
        return (
          <Autocomplete
            selectedKey={stringValue || null}
            onSelectionChange={(key) => field.onChange(key === null ? "" : String(key))}
            isInvalid={!!fieldState.error}
            isDisabled={disabled}
            className={cn("flex flex-col gap-1", className)}
          >
            <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
            <Autocomplete.Trigger className={TRIGGER_BASE} aria-invalid={!!fieldState.error}>
              <Autocomplete.Value className="truncate">
                {selected ? (
                  <div className="flex flex-col text-left">
                    <span>{selected.label}</span>
                    {selected.description ? (
                      <span className="text-xs text-muted-foreground">{selected.description}</span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-muted-foreground">{loading ? "Loading…" : placeholder}</span>
                )}
              </Autocomplete.Value>
              <Autocomplete.Indicator>
                <ChevronDownIcon className="size-4 opacity-60" />
              </Autocomplete.Indicator>
            </Autocomplete.Trigger>
            <Autocomplete.Popover className={POPOVER_BASE}>
              <Autocomplete.Filter>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Search…"
                    className={cn(SEARCH_BASE, "pl-9")}
                  />
                </div>
                <ListBox
                  className="max-h-60 overflow-auto p-1"
                  renderEmptyState={() => (
                    <div className="px-3 py-2 text-xs text-muted-foreground">{emptyMessage}</div>
                  )}
                >
                  {options.map((opt) => (
                    <ListBoxItem
                      key={opt.value}
                      id={opt.value}
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
              </Autocomplete.Filter>
            </Autocomplete.Popover>
            {fieldState.error ? (
              <span className="text-xs text-destructive">{fieldState.error.message}</span>
            ) : null}
          </Autocomplete>
        )
      }}
    />
  )
}
