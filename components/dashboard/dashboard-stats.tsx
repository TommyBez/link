import { FileText, CheckCircle, Users } from "lucide-react"

interface DashboardStatsProps {
  formsCount: number
  submissionsCount: number
  clientsCount: number
}

export function DashboardStats({ formsCount, submissionsCount, clientsCount }: DashboardStatsProps) {
  const stats = [
    {
      label: "Forms",
      value: formsCount,
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Completed",
      value: submissionsCount,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Clients",
      value: clientsCount,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
