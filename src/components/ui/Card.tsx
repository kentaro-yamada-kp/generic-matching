import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`border-border-soft bg-surface overflow-hidden rounded-2xl border shadow-xs transition-shadow duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div className={`border-border-soft border-b p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  as: Tag = "h3",
  className = "",
  ...props
}) => {
  return (
    <Tag className={`text-lg font-bold text-stone-800 ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <p className={`mt-1 text-sm text-stone-500 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`border-border-soft flex items-center justify-between border-t bg-stone-50/70 p-5 sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
