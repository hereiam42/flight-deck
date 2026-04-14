import Link from 'next/link'

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            {breadcrumbs.map((bc, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                {bc.href ? (
                  <Link href={bc.href} className="hover:text-foreground">{bc.label}</Link>
                ) : (
                  <span>{bc.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
