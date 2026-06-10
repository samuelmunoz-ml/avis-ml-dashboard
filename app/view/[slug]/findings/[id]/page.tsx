'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useData, markFindingsSeen } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { ResolutionStep } from '@/lib/types';
import { ChevronRight, ArrowRight, X } from 'lucide-react';

function StepIcon({ status }: { status: ResolutionStep['status'] }) {
  if (status === 'completed') {
    return (
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#000F1E' }}>
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === 'in_progress') {
    return (
      <div className="w-6 h-6 rounded-full border-[2px] border-[#3B82F6] bg-white flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
      </div>
    );
  }
  return <div className="w-6 h-6 rounded-full bg-white border-[2px] border-[#E5E7EB] flex-shrink-0" />;
}

export default function FindingDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const { data } = useData();
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const finding = data.findings.find((f) => f.id === id);

  useEffect(() => {
    if (id) markFindingsSeen(slug, [id]);
  }, [slug, id]);

  if (!finding) return (
    <div className="p-8 text-center">
      <p className="text-[#6B7280] text-[15px]">Finding not found.</p>
      <Link href={`/view/${slug}/findings`} className="text-[#234474] text-[13px] mt-2 inline-block font-medium">← Back to findings</Link>
    </div>
  );

  const relatedFindings = data.findings.filter((f) => finding.relatedFindingIds.includes(f.id));
  const findingIndex = data.findings.findIndex((f) => f.id === id);
  const nextFinding = data.findings[findingIndex + 1];

  return (
    <div className="p-8 max-w-[1080px]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 mb-6 text-[12.5px] fade-up">
        <Link href={`/view/${slug}/findings`} className="text-[#234474] font-medium hover:text-[#000F1E] transition-colors">Findings</Link>
        <ChevronRight size={13} className="text-[#D1D5DB]" />
        <span className="text-[#9CA3AF] truncate max-w-[300px]">{finding.title}</span>
      </nav>

      <div className="flex gap-7">
        {/* Main */}
        <div className="flex-1 min-w-0 fade-up fade-up-1">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <StatusBadge status="New" />
            <StatusBadge status={finding.status} />
            <span className={`text-[12.5px] font-semibold ${finding.severity === 'High' ? 'text-[#BE123C]' : finding.severity === 'Medium' ? 'text-[#C2410C]' : 'text-[#15803D]'}`}>
              {finding.severity} severity
            </span>
          </div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-[-0.02em] leading-tight mb-2">{finding.title}</h1>
          <p className="text-[12.5px] text-[#9CA3AF] mb-6">{finding.site} · Added {finding.dateAdded} by {finding.addedBy}</p>

          <p className="text-[14px] text-[#4B5563] leading-[1.7] mb-7">{finding.description}</p>

          {/* Images */}
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-2.5 mb-2">
              {(finding.images.length > 0 ? finding.images : [null, null, null, null]).map((img, i) => (
                <button
                  key={i}
                  onClick={() => img && setLightboxImg(img)}
                  className="aspect-[3/4] rounded-[10px] overflow-hidden border transition-all duration-200"
                  style={{ borderColor: 'rgba(0,15,30,0.08)', cursor: img ? 'zoom-in' : 'default' }}
                >
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full" style={{ background: 'repeating-linear-gradient(45deg, #F3F4F6 0px, #F3F4F6 1px, #FAFAFA 1px, #FAFAFA 16px)' }} />
                  )}
                </button>
              ))}
            </div>
            <p className="text-[11.5px] text-[#9CA3AF]">Click any image to open full-size.</p>
          </div>

          {/* Resolution path */}
          <div
            className="bg-white rounded-[14px] p-6 mb-6"
            style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}
          >
            <h2 className="text-[16px] font-bold text-[#111827] tracking-[-0.01em] mb-1">Resolution path</h2>
            <p className="text-[12.5px] text-[#9CA3AF] mb-6">Steps to resolution — current status tracked below</p>
            <div className="space-y-0">
              {finding.resolutionSteps.map((step, i) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <StepIcon status={step.status} />
                    {i < finding.resolutionSteps.length - 1 && (
                      <div className="w-px flex-1 my-2" style={{ background: step.status === 'completed' ? '#000F1E' : '#E5E7EB', minHeight: '28px' }} />
                    )}
                  </div>
                  <div className={`pb-6 flex-1 min-w-0 ${i === finding.resolutionSteps.length - 1 ? 'pb-0' : ''}`}>
                    <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] mb-0.5">Step {step.stepNumber}</p>
                    <h3 className={`text-[14.5px] font-semibold mb-1 ${step.status === 'pending' ? 'text-[#9CA3AF]' : 'text-[#111827]'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-[13px] leading-relaxed mb-1 ${step.status === 'pending' ? 'text-[#C4C9D0]' : 'text-[#6B7280]'}`}>
                      {step.description}
                    </p>
                    {step.completedDate && <p className="text-[11.5px] text-[#9CA3AF]">Completed {step.completedDate}</p>}
                    {step.status === 'in_progress' && !step.completedDate && (
                      <p className="text-[11.5px] text-[#1D4ED8] font-medium">In progress</p>
                    )}
                    {step.status === 'pending' && <p className="text-[11.5px] text-[#C4C9D0]">Pending</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {nextFinding && (
            <Link
              href={`/view/${slug}/findings/${nextFinding.id}`}
              className="inline-flex items-center gap-2.5 h-11 px-6 rounded-[10px] text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 group"
              style={{ background: '#000F1E', boxShadow: '0 1px 3px rgba(0,15,30,0.2)' }}
            >
              Next finding
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight size={13} strokeWidth={2} />
              </div>
            </Link>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-[260px] flex-shrink-0 space-y-4 fade-up fade-up-2">
          <div
            className="bg-white rounded-[14px] p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}
          >
            <p className="text-[11.5px] font-bold text-[#374151] mb-4 uppercase tracking-[0.06em]">Metadata</p>
            <dl className="space-y-3.5">
              {[
                { label: 'STATUS', value: <StatusBadge status={finding.status} /> },
                { label: 'SITE', value: finding.site },
                { label: 'CATEGORY', value: finding.category },
                { label: 'SEVERITY', value: <span className={`font-semibold text-[13px] ${finding.severity === 'High' ? 'text-[#BE123C]' : finding.severity === 'Medium' ? 'text-[#C2410C]' : 'text-[#15803D]'}`}>{finding.severity}</span> },
                { label: 'ADDED BY', value: finding.addedBy },
                { label: 'DATE ADDED', value: finding.dateAdded },
                { label: 'LAST UPDATED', value: finding.lastUpdated },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <dt className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.06em] mt-0.5">{label}</dt>
                  <dd className="text-[12.5px] text-[#111827] font-medium text-right max-w-[140px]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {relatedFindings.length > 0 && (
            <div
              className="bg-white rounded-[14px] p-5"
              style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}
            >
              <p className="text-[11.5px] font-bold text-[#374151] mb-4 uppercase tracking-[0.06em]">Related findings</p>
              {relatedFindings.map((rf) => (
                <div key={rf.id} className="group">
                  <p className="text-[13.5px] font-semibold text-[#111827] mb-2 leading-snug">{rf.title}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status="New" />
                    <StatusBadge status={rf.status} />
                  </div>
                  <Link href={`/view/${slug}/findings/${rf.id}`} className="text-[12.5px] font-semibold text-[#234474] hover:text-[#000F1E] flex items-center gap-0.5 transition-colors">
                    View detail <ArrowUpRight size={12} strokeWidth={2} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-8"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxImg(null)}
          >
            <X size={18} />
          </button>
          <img src={lightboxImg} alt="" className="max-w-full max-h-full rounded-[14px] shadow-2xl" />
        </div>
      )}
    </div>
  );
}

// Missing import
function ArrowUpRight(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 16} height={props.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h10v10M7 17L17 7"/>
    </svg>
  );
}
