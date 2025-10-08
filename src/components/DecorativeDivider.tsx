export const DecorativeDivider = () => {
  return (
    <div className="w-full max-w-xs mx-auto my-8 flex items-center justify-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="w-2 h-2 rotate-45 border border-border" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
};
