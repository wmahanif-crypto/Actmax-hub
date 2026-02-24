import React from 'react';

export const ReportTemplate = React.forwardRef(({ Ticket, Staff = [] }: any, ref: any) => {

  return (
    <div ref={ref} className="p-12 bg-white text-black min-h-[297mm] font-sans relative">
      {/* Header Report */}
      <div className="flex justify-between items-start border-b-4 border-red-600 pb-6 mb-8">
        <div>
          <img 
            src="/Actmax_Logo2.png" 
            alt="Actmax Logo" 
            className="h-12 w-auto mb-2 object-contain" 
          />
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">IT Infrastructure Service Management</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black">TICKET ID: <span className="text-red-600 font-mono">#{Ticket?.id?.slice(0, 8)}</span></p>
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1 italic">Generated: {new Date().toLocaleString('en-GB')}</p>
        </div>
      </div>

      {/* Main Grid Info */}
      <div className="grid grid-cols-2 gap-10 mb-10">
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase border-b-2 border-zinc-100 pb-1 text-zinc-400 tracking-widest text-left">Requestor Info</h2>
          <div className="text-sm space-y-1">
            <p><span className="text-zinc-400 font-medium">Name:</span> <span className="font-bold uppercase">{Ticket?.userName}</span></p>
            <p><span className="text-zinc-400 font-medium">Dept:</span> <span className="font-bold uppercase">{Staff?.userDept}</span></p>
            <p><span className="text-zinc-400 font-medium">Loc:</span> <span className="font-bold uppercase">{Ticket?.plant} - {Ticket?.location}</span></p>
            {/* --- TAMBAH BILA TIKET DIBUAT --- */}
            <p><span className="text-zinc-400 font-medium">Created:</span> <span className="font-bold uppercase text-[11px]">{Ticket?.createdAt ? new Date(Ticket.createdAt).toLocaleString('en-GB') : '-'}</span></p>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase border-b-2 border-zinc-100 pb-1 text-zinc-400 tracking-widest text-left">Technical Milestone</h2>
          <div className="text-sm space-y-1">
            <p><span className="text-zinc-400 font-medium">Category:</span> <span className="font-bold uppercase">{Ticket?.category}</span></p>
            {/* --- TAMBAH BILA TIKET DIASSIGN --- */}
            <p><span className="text-zinc-400 font-medium">Assigned:</span> <span className="font-bold uppercase text-[11px]">{Ticket?.assignedAt ? new Date(Ticket.assignedAt).toLocaleString('en-GB') : 'NOT ASSIGNED'}</span></p>
            {/* --- TAMBAH BILA TIKET SELESAI --- */}
            <p><span className="text-zinc-400 font-medium">Resolved:</span> <span className="font-bold uppercase text-[11px] text-green-600">{Ticket?.completedAt ? new Date(Ticket.completedAt).toLocaleString('en-GB') : 'IN PROGRESS'}</span></p>
          </div>
        </div>
      </div>

      {/* Staff / Employee Table */}
      <div className="mb-10">
        <h2 className="text-[10px] font-black uppercase border-b-2 border-zinc-100 pb-1 text-zinc-400 tracking-widest mb-4">Assigned Personnel</h2>
        <table className="w-full text-xs border border-zinc-200">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="p-2 text-left font-black uppercase tracking-widest w-1/2">Staff Name</th>
              <th className="p-2 text-left font-black uppercase tracking-widest w-1/2">Staff ID</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border-r border-zinc-200 uppercase font-bold text-zinc-800">{Staff?.userName || Ticket?.assignedTo || 'NOT ASSIGNED'}</td>
              <td className="p-2 border-r border-zinc-200 font-mono">{Staff?.userLoginID || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Issue & Action */}
      <div className="space-y-6 mb-12">
        <div className="p-5 bg-zinc-50 rounded-lg border-l-4 border-red-600">
          <h2 className="text-[9px] font-black uppercase mb-2 text-red-600 tracking-widest italic">Problem Statement</h2>
          <p className="text-lg font-bold text-zinc-900 mb-1">{Ticket?.subject}</p>
          <p className="text-sm text-zinc-600 italic leading-relaxed">{Ticket?.specificProblem}</p>
        </div>

        <div className="p-5 bg-zinc-50 rounded-lg border-l-4 border-green-600">
          <h2 className="text-[9px] font-black uppercase mb-2 text-green-600 tracking-widest italic">Resolution / Action Taken</h2>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed min-h-[80px]">
            {Ticket?.actionTaken || "Internal technical resolution carried out as per IT standard operating procedures."}
          </p>
        </div>
      </div>

      {/* Digital Verification Section */}
      <div className="mt-20">
        <h2 className="text-[10px] font-black uppercase text-center text-zinc-400 tracking-[0.4em] mb-8">Digital Verification Log</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          
          {/* Reporter Log */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-black text-zinc-800 uppercase">{Ticket?.userName}</div>
            <div className="text-[8px] text-zinc-400 font-bold uppercase mt-1">Requested via System</div>
            {/* Timestamp Reporter */}
            <div className="text-[8px] text-zinc-500 font-medium mt-1 uppercase italic">
              {Ticket?.createdAt ? new Date(Ticket.createdAt).toLocaleString('en-GB') : '-'}
            </div>
          </div>

          {/* HOD Approval Log */}
          <div className="flex flex-col items-center border-x border-zinc-100 px-2">
            {Ticket?.FirstApproval ? (
              <>
                <div className="text-green-600 font-black text-[12px] italic tracking-tighter">✓ VERIFIED BY SYSTEM</div>
                <div className="text-[9px] font-bold text-zinc-800 uppercase mt-1 leading-none">
                  {Ticket?.fApprovalFullName}
                </div>
                <div className="text-[8px] text-zinc-400 font-bold uppercase mt-1 italic leading-none">HOD Approved</div>
                {/* --- TAMBAH TARIKH HOD APPROVE --- */}
                <div className="text-[8px] text-zinc-500 font-medium mt-1 uppercase italic">
                  {new Date(Ticket.FirstApprovalAt).toLocaleString('en-GB')}
                </div>
              </>
            ) : (
              <div className="text-zinc-300 font-black text-[10px] uppercase italic">Pending Approval</div>
            )}
          </div>

          {/* Management/CEO Approval Log */}
          <div className="flex flex-col items-center">
             {Ticket?.category === 'INCIDENT' ? (
                <div className="text-[8px] text-zinc-300 font-bold uppercase italic mt-2 underline decoration-zinc-100 underline-offset-4">Not Required for Incident</div>
             ) : Ticket?.SecondApproval ? (
              <>
                <div className="text-blue-600 font-black text-[12px] italic tracking-tighter">✓ VERIFIED BY SYSTEM</div>
                <div className="text-[9px] font-bold text-zinc-800 uppercase mt-1">
                  {Ticket?.sApprovalFullName}
                </div>
                <div className="text-[8px] text-zinc-400 font-bold uppercase mt-1 italic leading-none">Management Approved</div>
                {/* --- TAMBAH TARIKH CEO APPROVE --- */}
                <div className="text-[8px] text-zinc-500 font-medium mt-1 uppercase italic">
                  {new Date(Ticket.SecondApprovalAt).toLocaleString('en-GB')}
                </div>
              </>
            ) : (
              <div className="text-zinc-300 font-black text-[10px] uppercase italic">Management Review Pending</div>
            )}
          </div>

        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-12 left-12 right-12">
        <div className="border-t border-zinc-200 pt-6 flex justify-between items-center">
          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-[0.3em]">
            This is a computer-generated document. No signature is required.
          </p>
          <div className="px-3 py-1 bg-zinc-900 text-white text-[8px] font-black tracking-widest rounded">
            ACTMAX-IT-AUTO-VERIFIED
          </div>
        </div>
      </div>
    </div>
  );
});

ReportTemplate.displayName = "ReportTemplate";