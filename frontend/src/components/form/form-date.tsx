"use client"

import * as React from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
  DateField,
  DatePicker,
  Label,
} from "@heroui/react"
import { CalendarDate, parseDate } from "@internationalized/date"
import type { DateValue } from "react-aria-components/Calendar"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type FormDateProps<TForm extends FieldValues> = {
  control: Control<TForm>
  name: FieldPath<TForm>
  label: string
  disabled?: boolean
  className?: string
  minValue?: CalendarDate
  maxValue?: CalendarDate
}

const GROUP_BASE =
  "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition-colors hover:bg-accent/40 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 aria-invalid:border-destructive"

const POPOVER_BASE =
  "z-50 rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-md"

function tryParse(value: unknown): CalendarDate | null {
  if (!value) return null
  if (typeof value === "string") {
    try {
      return parseDate(value.slice(0, 10))
    } catch {
      return null
    }
  }
  return null
}

function format(value: DateValue | null): string {
  if (!value) return ""
  return value.toString().slice(0, 10)
}

export function FormDate<TForm extends FieldValues>({
  control,
  name,
  label,
  disabled,
  className,
  minValue,
  maxValue,
}: FormDateProps<TForm>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = tryParse(field.value)
        return (
          <DatePicker
            value={value}
            onChange={(v) => field.onChange(format(v))}
            isInvalid={!!fieldState.error}
            isDisabled={disabled}
            minValue={minValue}
            maxValue={maxValue}
            className={cn("flex flex-col gap-1", className)}
          >
            <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
            <DateField.Group className={GROUP_BASE} aria-invalid={!!fieldState.error}>
              <DateField.InputContainer className="flex flex-1 items-center gap-0.5">
                <DateField.Input>
                  {(segment) => (
                    <DateField.Segment
                      segment={segment}
                      className="rounded px-0.5 tabular-nums outline-none focus:bg-accent focus:text-accent-foreground"
                    />
                  )}
                </DateField.Input>
              </DateField.InputContainer>
              <DatePicker.Trigger className="grid size-6 place-items-center rounded text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40">
                <DatePicker.TriggerIndicator>
                  <CalendarIcon className="size-4" />
                </DatePicker.TriggerIndicator>
              </DatePicker.Trigger>
            </DateField.Group>
            <DatePicker.Popover className={POPOVER_BASE}>
              <Calendar className="w-[18rem]">
                <CalendarHeader className="mb-2 flex items-center justify-between">
                  <CalendarNavButton
                    slot="previous"
                    className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent"
                  >
                    <ChevronLeftIcon className="size-4" />
                  </CalendarNavButton>
                  <CalendarHeading className="text-sm font-semibold" />
                  <CalendarNavButton
                    slot="next"
                    className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent"
                  >
                    <ChevronRightIcon className="size-4" />
                  </CalendarNavButton>
                </CalendarHeader>
                <CalendarGrid className="w-full">
                  <CalendarGridHeader>
                    {(day) => (
                      <CalendarHeaderCell className="pb-1 text-center text-[0.7rem] font-medium text-muted-foreground">
                        {day}
                      </CalendarHeaderCell>
                    )}
                  </CalendarGridHeader>
                  <CalendarGridBody>
                    {(date) => (
                      <CalendarCell
                        date={date}
                        className="mx-auto grid size-8 place-items-center rounded-md text-sm text-foreground outline-none data-[outside-month=true]:text-muted-foreground/40 data-[focused=true]:ring-2 data-[focused=true]:ring-ring/40 data-[hovered=true]:bg-accent data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40"
                      />
                    )}
                  </CalendarGridBody>
                </CalendarGrid>
              </Calendar>
            </DatePicker.Popover>
            {fieldState.error ? (
              <span className="text-xs text-destructive">{fieldState.error.message}</span>
            ) : null}
          </DatePicker>
        )
      }}
    />
  )
}
