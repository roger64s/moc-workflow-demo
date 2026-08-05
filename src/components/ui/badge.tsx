import * as React from "react"
export const Badge = ({ className, variant = "default", ...props }: any) => {
  const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
  const variants = variant === "default" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  return <div className={`${base} ${variants} ${className}`} {...props} />
}