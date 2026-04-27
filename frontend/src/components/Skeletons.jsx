export const DoctorCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-slate-200 rounded" />
      <div className="h-3 bg-slate-200 rounded w-5/6" />
    </div>
    <div className="mt-4 h-9 bg-slate-200 rounded-xl" />
  </div>
);

export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-full" />
      </td>
    ))}
  </tr>
);

export const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="bg-white p-8 rounded-3xl border border-slate-100">
      <div className="flex gap-6 items-center">
        <div className="w-24 h-24 rounded-2xl bg-slate-200" />
        <div className="space-y-3 flex-1">
          <div className="h-6 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);
