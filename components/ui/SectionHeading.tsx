type SectionHeadingProps = {
  children: React.ReactNode;
  id?: string;
  className?: string;
};

export function SectionHeading({ children, id, className = "" }: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className={`text-[22px] font-bold leading-tight text-heading md:text-[36px] ${className}`}
    >
      {children}
    </h2>
  );
}
