'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData, markFindingsSeen } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { ResolutionStep } from '@/lib/types';

function StepIcon({ status }: { status: ResolutionStep['status'] }) {
  if (status === 'completed') {
    return (
      <div className="w-6 h-6 rounded-full bg-[#234474] flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === 'in_progress') {
    return (
      <div className="w-6 h-6 rounded-full border-2 border-[#234474] bg-white flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#234474]" />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full border-2 border-[#DAD9D6] bg-white flex-shrink-0" />
  );
}

export default function FindingDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const { data } = useData();
  const router = useRouter();
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const finding = data.findings.find((f) => f.id === id);

  useEffect(() => {
    if (id) markFindingsSeen(slug, [id]);
  }, [slug, id]);

  if (!finding) {
    return (
      <div className="p-8 text-center text-[#939598]">
        <p>Finding not found.</p>
        <Link href={`/view/${slug}/findings`} className="text-[#234474] text-sm mt-2 inline-block">← Back to findings</Link>
      </div>
    );
  }

  const relatedFindings = data.findings.filter((f) => finding.relatedFindingIds.includes(f.id));
  const isNew = !(data.seenFindings[slug] ?? []).includes(id);
  const findingIndex = data.findings.findIndex((f) => f.id === id);
  const nextFinding = data.findings[findingIndex + 1];

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[13px]">
        <Link href={`/view/${slug}/findings`} className="text-[#234474] hover:text-[#1A2D45]">Findings</Link>
        <span className="text-[#939598]">›</span>
        <span className="text-[#939598] truncate max-w-[300px]">{finding.title}</span>
      </div>

      <div className="flex gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            {isNew && <StatusBadge status="New" />}
            <StatusBadge status={finding.status} />
          </div>
          <h1 className="text-[32px] font-bold text-[#000F1E] leading-tight mb-2">{finding.title}</h1>
          <p className="text-[13px] text-[#939598] mb-6">
            {finding.site} — Added {finding.dateAdded} by {finding.addedBy}
          </p>

          <p className="text-sm text-[#464A4D] leading-relaxed mb-6">{finding.description}</p>

          {/* Images */}
          {finding.images.length > 0 ? (
            <div className="mb-6">
              <div className="grid grid-cols-4 gap-3 mb-2">
                {finding.images.map((img, i) => (
                  <button key={i} onClick={() => setLightboxImg(img)} className="aspect-[3/4] rounded overflow-hidden border border-[#DAD9D6] hover:border-[#234474] transition-colors">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-[#939598]">Click any image to open full-size. Annotated images include marked regions.</p>
            </div>
          ) : (
            <div className="mb-6">
              <div className="grid grid-cols-4 gap-3 mb-2">
                {[0,1,2,3].map((i) => (
                  <div key={i} className="aspect-[3/4] rounded overflow-hidden border border-[#DAD9D6]">
                    <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, #EFF0F0 25%, transparent 25%), linear-gradient(-45deg, #EFF0F0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #EFF0F0 75%), linear-gradient(-45deg, transparent 75%, #EFF0F0 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px', backgroundColor: '#F7F7F6' }} />
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-[#939598]">Click any image to open full-size. Annotated images include marked regions.</p>
            </div>
          )}

          {/* Resolution path */}
          <div className="mb-6">
            <h2 className="text-[18px] font-semibold text-[#000F1E] mb-1.5">Resolution path</h2>
            <p className="text-[13px] text-[#939598] mb-5">Steps to resolution — current status tracked below</p>
            <div className="space-y-0">
              {finding.resolutionSteps.map((step, i) => (
                <div key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <StepIcon status={step.status} />
                    {i < finding.resolutionSteps.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${step.status === 'completed' ? 'bg-[#234474]' : 'bg-[#DAD9D6]'}`} style={{ minHeight: '32px' }} />
                    )}
                  </div>
                  <div className="pb-6 flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#234474] mb-0.5">Step {step.stepNumber}</p>
                    <h3 className={`text-[15px] font-semibold mb-1 ${step.status === 'pending' ? 'text-[#939598]' : 'text-[#000F1E]'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-[13px] leading-relaxed mb-1 ${step.status === 'pending' ? 'text-[#B7B8B9]' : 'text-[#464A4D]'}`}>
                      {step.description}
                    </p>
                    {step.completedDate && (
                      <p className="text-[12px] text-[#939598]">Completed {step.completedDate}</p>
                    )}
                    {step.status === 'in_progress' && !step.completedDate && (
                      <p className="text-[12px] text-[#1565C0]">In progress — assigned to ABG checkout team</p>
                    )}
                    {step.status === 'pending' && (
                      <p className="text-[12px] text-[#939598]">Pending</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {nextFinding && (
            <Link
              href={`/view/${slug}/findings/${nextFinding.id}`}
              className="inline-flex items-center h-11 px-6 bg-[#000F1E] text-white text-sm font-medium rounded-[4px] hover:bg-[#0D1E35] transition-colors"
            >
              Next finding →
            </Link>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 space-y-6">
          <div className="border border-[#DAD9D6] rounded-lg p-5 bg-white">
            <h3 className="text-[15px] font-semibold text-[#000F1E] mb-4">Metadata</h3>
            <dl className="space-y-3">
              <div className="flex justify-between items-start">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">STATUS</dt>
                <dd><StatusBadge status={finding.status} /></dd>
              </div>
              <div className="flex justify-between items-start">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">SITE</dt>
                <dd className="text-[13px] text-[#000F1E] font-medium">{finding.site}</dd>
              </div>
              <div className="flex justify-between items-start">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">CATEGORY</dt>
                <dd className="text-[13px] text-[#000F1E] font-medium text-right max-w-[140px]">{finding.category}</dd>
              </div>
              <div className="flex justify-between items-start">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">SEVERITY</dt>
                <dd className={`text-[13px] font-semibold ${finding.severity === 'High' ? 'text-[#C62828]' : finding.severity === 'Medium' ? 'text-[#E65100]' : 'text-[#2E7D32]'}`}>
                  {finding.severity}
                </dd>
              </div>
              <div className="flex justify-between items-start">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">ADDED BY</dt>
                <dd className="text-[13px] text-[#000F1E] font-medium">{finding.addedBy}</dd>
              </div>
              <div className="flex justify-between items-start">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">DATE ADDED</dt>
                <dd className="text-[13px] text-[#000F1E] font-medium">{finding.dateAdded}</dd>
              </div>
              <div className="flex justify-between items-start">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">LAST UPDATED</dt>
                <dd className="text-[13px] text-[#000F1E] font-medium">{finding.lastUpdated}</dd>
              </div>
            </dl>
          </div>

          {relatedFindings.length > 0 && (
            <div className="border border-[#DAD9D6] rounded-lg p-5 bg-white">
              <h3 className="text-[15px] font-semibold text-[#000F1E] mb-4">Related findings</h3>
              {relatedFindings.map((rf) => (
                <div key={rf.id}>
                  <p className="text-[14px] font-medium text-[#000F1E] mb-2">{rf.title}</p>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status="New" />
                    <StatusBadge status={rf.status} />
                  </div>
                  <Link href={`/view/${slug}/findings/${rf.id}`} className="text-[13px] text-[#234474] font-medium hover:text-[#1A2D45]">
                    View detail
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
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} alt="" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
