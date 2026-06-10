"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2Icon, PlusIcon, ReceiptIcon, Trash2Icon, XCircleIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { FormCombobox, FormDate, FormField, FormSelect } from "@/components/form"
import { api, csrf, sanitizePayload } from "@/lib/api/client"
import { useLookup } from "@/lib/api/lookups"

const EXPENSE_CATEGORY_OPTIONS = [
  { value: "travel", label: "Travel" },
  { value: "meals", label: "Meals" },
  { value: "supplies", label: "Supplies" },
  { value: "equipment", label: "Equipment" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" },
]

const schema = z.object({
  employee_id: z.coerce.number().min(1, "Required"),
  category: z.enum(["travel", "meals", "supplies", "equipment", "training", "other"]),
  description: z.string().min(1, "Required"),
  amount: z.coerce.number().min(0.01, "Min 0.01"),
  currency: z.string().default("USD"),
  expense_date: z.string().min(1, "Required"),
})

type ExpenseFormInput = z.input<typeof schema>
type ExpenseForm = z.infer<typeof schema>

type Expense = {
  id: number
  category: string
  description: string
  amount: string | number
  currency: string
  expense_date: string
  status: string
  employee?: { id: number; first_name: string; last_name: string } | null
  approver?: { id: number; name: string } | null
  created_at: string
}

const initialExpenses: Expense[] = []

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export function ExpenseManagement() {
  const [expenses, setExpenses] = React.useState<Expense[]>(initialExpenses)
  const [showForm, setShowForm] = React.useState(false)
  const [filter, setFilter] = React.useState("all")

  const form = useForm<ExpenseFormInput, unknown, ExpenseForm>({
    resolver: zodResolver(schema),
    defaultValues: { employee_id: "", category: "travel", description: "", amount: 0, currency: "USD", expense_date: "" },
  })

  const expenseEmployees = useLookup("employees")

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/expenses")
        if (mounted && Array.isArray(res.data?.data)) setExpenses(res.data.data)
      } catch {
        if (mounted) setExpenses(initialExpenses)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function cancelForm() {
    form.reset({ employee_id: "", category: "travel", description: "", amount: 0, currency: "USD", expense_date: "" })
    setShowForm(false)
  }

  async function onSubmit(values: ExpenseForm) {
    try {
      await csrf()
      const res = await api.post("/api/v1/expenses", sanitizePayload(values))
      setExpenses((cur) => [res.data?.data, ...cur])
      sileo.success({ title: "Expense submitted" })
      cancelForm()
    } catch {
      sileo.error({ title: "Submit failed", description: "The expense was not saved to the backend." })
    }
  }

  async function handleAction(id: number, action: "approve" | "reject") {
    try {
      await csrf()
      const res = await api.put(`/api/v1/expenses/${id}/${action}`)
      const updated = res.data?.data as Expense
      setExpenses((cur) => cur.map((e) => (e.id === id ? updated : e)))
      sileo.success({ title: action === "approve" ? "Approved" : "Rejected" })
    } catch { sileo.error({ title: "Action failed" }) }
  }

  async function handleDelete(id: number) {
    try {
      await csrf()
      await api.delete(`/api/v1/expenses/${id}`)
      setExpenses((cur) => cur.filter((e) => e.id !== id))
      sileo.success({ title: "Expense deleted" })
    } catch { sileo.error({ title: "Delete failed" }) }
  }

  const filtered = filter === "all" ? expenses : expenses.filter((e) => e.status === filter)

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ReceiptIcon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Expenses</h1>
              <p className="text-sm text-muted-foreground">Submit and manage expense claims</p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) cancelForm() }}>
            <PlusIcon className="size-4" />
            {showForm ? "Cancel" : "New Expense"}
          </Button>
        </div>
      </section>

      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {showForm && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">New Expense</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
            <FormCombobox
              control={form.control}
              name="employee_id"
              label="Employee"
              options={expenseEmployees.options}
              loading={expenseEmployees.loading}
              placeholder="Select employee"
            />
            <FormSelect
              control={form.control}
              name="category"
              label="Category"
              options={EXPENSE_CATEGORY_OPTIONS}
            />
            <FormField control={form.control} name="amount" label="Amount" type="number" inputMode="decimal" />
            <FormDate control={form.control} name="expense_date" label="Date" />
            <FormField
              control={form.control}
              name="description"
              label="Description"
              className="md:col-span-2"
            />
            <div className="md:col-span-2">
              <Button type="submit">Submit Expense</Button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Employee</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">{e.employee ? `${e.employee.first_name} ${e.employee.last_name}` : "—"}</td>
                  <td className="p-3 capitalize">{e.category}</td>
                  <td className="p-3 text-muted-foreground">{e.description}</td>
                  <td className="p-3 font-mono">${Number(e.amount).toFixed(2)}</td>
                  <td className="p-3">{e.expense_date}</td>
                  <td className="p-3"><span className={`rounded-md px-2 py-0.5 text-xs capitalize ${statusColors[e.status] ?? ""}`}>{e.status}</span></td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {e.status === "pending" && (
                        <>
                          <button className="rounded-md p-1.5 text-green-600 hover:bg-green-50" onClick={() => handleAction(e.id, "approve")}><CheckCircle2Icon className="size-3.5" /></button>
                          <button className="rounded-md p-1.5 text-red-600 hover:bg-red-50" onClick={() => handleAction(e.id, "reject")}><XCircleIcon className="size-3.5" /></button>
                        </>
                      )}
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(e.id)}><Trash2Icon className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No expenses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
