'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProfile, saveProfile } from '@/services/profile.service';
import type { MasterProfile } from '@/ai/schemas';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label
        className="block text-xs font-medium uppercase tracking-wider"
        style={{ color: 'var(--color-on-surface-variant)' }}
      >
        {label}
        {required && <span className="ml-0.5 text-[color:var(--color-error)]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-[var(--radius-lg)] px-3 py-2 text-sm outline-none ' +
  'bg-[color:var(--color-surface-container-high)] ' +
  'text-[color:var(--color-on-surface)] ' +
  'focus:ring-1 focus:ring-[color:var(--color-secondary)] transition-all';

const sectionCls =
  'rounded-[var(--radius-xl)] p-6 ' + 'bg-[color:var(--color-surface-container-low)]';

// ---------------------------------------------------------------------------
// Section-level sub-components
// ---------------------------------------------------------------------------

function PersonalInfoTab({
  profile,
  onChange,
}: {
  profile: MasterProfile;
  onChange: (patch: Partial<MasterProfile>) => void;
}) {
  return (
    <section className={sectionCls}>
      <h2
        className="mb-4 text-lg font-semibold"
        style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
      >
        Personal Info
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Field label="Full Name" required>
          <input
            className={inputCls}
            type="text"
            aria-label="Full Name"
            value={profile.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Field>
        <Field label="Email" required>
          <input
            className={inputCls}
            type="email"
            aria-label="Email"
            value={profile.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </Field>
        <Field label="Phone" required>
          <input
            className={inputCls}
            type="tel"
            aria-label="Phone"
            value={profile.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </Field>
        <Field label="Location">
          <input
            className={inputCls}
            type="text"
            aria-label="Location"
            value={profile.address?.city ?? ''}
            onChange={(e) =>
              onChange({
                address: { ...(profile.address ?? { country: 'US' }), city: e.target.value },
              })
            }
          />
        </Field>
        <Field label="LinkedIn">
          <input
            className={inputCls}
            type="url"
            aria-label="LinkedIn"
            value={profile.links?.linkedin ?? ''}
            onChange={(e) =>
              onChange({ links: { ...(profile.links ?? {}), linkedin: e.target.value } })
            }
          />
        </Field>
        <Field label="GitHub">
          <input
            className={inputCls}
            type="url"
            aria-label="GitHub"
            value={profile.links?.github ?? ''}
            onChange={(e) =>
              onChange({ links: { ...(profile.links ?? {}), github: e.target.value } })
            }
          />
        </Field>
        <Field label="Portfolio">
          <input
            className={inputCls}
            type="url"
            aria-label="Portfolio"
            value={profile.links?.portfolio ?? ''}
            onChange={(e) =>
              onChange({ links: { ...(profile.links ?? {}), portfolio: e.target.value } })
            }
          />
        </Field>
      </div>
    </section>
  );
}

function SummaryTab({
  profile,
  onChange,
}: {
  profile: MasterProfile;
  onChange: (patch: Partial<MasterProfile>) => void;
}) {
  return (
    <section className={sectionCls}>
      <h2
        className="mb-4 text-lg font-semibold"
        style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
      >
        Summary
      </h2>
      <Field label="Summary">
        <textarea
          className={inputCls + ' min-h-[120px] resize-y'}
          value={profile.summary ?? ''}
          onChange={(e) => onChange({ summary: e.target.value })}
        />
      </Field>
    </section>
  );
}

function SkillsTab({
  profile,
  onChange,
}: {
  profile: MasterProfile;
  onChange: (patch: Partial<MasterProfile>) => void;
}) {
  const [newSkill, setNewSkill] = useState('');

  function addSkill() {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    onChange({ skills: [...profile.skills, { name: trimmed }] });
    setNewSkill('');
  }

  function removeSkill(index: number) {
    onChange({ skills: profile.skills.filter((_, i) => i !== index) });
  }

  return (
    <section className={sectionCls}>
      <h2
        className="mb-4 text-lg font-semibold"
        style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
      >
        Technical Skills
      </h2>
      <div className="mb-5 flex flex-wrap gap-2">
        {profile.skills.map((skill, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-[var(--radius-lg)] px-3 py-1.5 text-sm"
            style={{
              backgroundColor: 'var(--color-surface-container-high)',
              color: 'var(--color-on-surface)',
            }}
          >
            {skill.name}
            <button
              aria-label={`Remove ${skill.name}`}
              onClick={() => removeSkill(i)}
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className={inputCls + ' flex-1'}
          placeholder="Add a skill…"
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
          aria-label="New skill"
        />
        <button
          onClick={addSkill}
          className="rounded-[var(--radius-lg)] px-5 py-2.5 text-sm font-medium"
          style={{
            backgroundColor: 'var(--color-surface-container-high)',
            color: 'var(--color-on-surface)',
          }}
        >
          Add
        </button>
      </div>
    </section>
  );
}

function ExperienceTab({
  profile,
  onChange,
}: {
  profile: MasterProfile;
  onChange: (patch: Partial<MasterProfile>) => void;
}) {
  const updateEntry = (index: number, patch: Partial<MasterProfile['workExperience'][number]>) => {
    const updated = profile.workExperience.map((e, i) => (i === index ? { ...e, ...patch } : e));
    onChange({ workExperience: updated });
  };

  const addEntry = () => {
    onChange({
      workExperience: [
        ...profile.workExperience,
        { company: '', title: '', startDate: '', endDate: null, descriptions: [] },
      ],
    });
  };

  const removeEntry = (index: number) => {
    onChange({ workExperience: profile.workExperience.filter((_, i) => i !== index) });
  };

  const addDescription = (entryIndex: number) => {
    const entry = profile.workExperience[entryIndex];
    updateEntry(entryIndex, { descriptions: [...entry.descriptions, ''] });
  };

  const updateDescription = (entryIndex: number, descIndex: number, value: string) => {
    const descs = profile.workExperience[entryIndex].descriptions.map((d, i) =>
      i === descIndex ? value : d
    );
    updateEntry(entryIndex, { descriptions: descs });
  };

  const removeDescription = (entryIndex: number, descIndex: number) => {
    const descs = profile.workExperience[entryIndex].descriptions.filter((_, i) => i !== descIndex);
    updateEntry(entryIndex, { descriptions: descs });
  };

  return (
    <section className={sectionCls}>
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
        >
          Work Experience
        </h2>
        <button
          onClick={addEntry}
          className="text-sm font-medium"
          style={{ color: 'var(--color-secondary)' }}
        >
          + Add Role
        </button>
      </div>
      <div className="space-y-6">
        {profile.workExperience.map((exp, i) => (
          <div
            key={i}
            className="group relative rounded-[var(--radius-xl)] p-5"
            style={{ backgroundColor: 'var(--color-surface-container)' }}
          >
            <button
              aria-label="Remove experience entry"
              onClick={() => removeEntry(i)}
              className="absolute right-4 top-4 text-sm opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              ×
            </button>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Company">
                <input
                  className={inputCls}
                  type="text"
                  aria-label="Company"
                  value={exp.company}
                  onChange={(e) => updateEntry(i, { company: e.target.value })}
                />
              </Field>
              <Field label="Role">
                <input
                  className={inputCls}
                  type="text"
                  aria-label="Role"
                  value={exp.title}
                  onChange={(e) => updateEntry(i, { title: e.target.value })}
                />
              </Field>
              <Field label="Location">
                <input
                  className={inputCls}
                  type="text"
                  aria-label="Location"
                  value={exp.location ?? ''}
                  onChange={(e) => updateEntry(i, { location: e.target.value })}
                />
              </Field>
              <Field label="Start Date">
                <input
                  className={inputCls}
                  type="date"
                  aria-label="Start Date"
                  value={exp.startDate}
                  onChange={(e) => updateEntry(i, { startDate: e.target.value })}
                />
              </Field>
              <Field label="End Date">
                <input
                  className={inputCls}
                  type="date"
                  aria-label="End Date"
                  value={exp.endDate ?? ''}
                  placeholder="Present"
                  onChange={(e) => updateEntry(i, { endDate: e.target.value || null })}
                />
              </Field>
            </div>
            <div className="space-y-2">
              <label
                className="block text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                Highlights
              </label>
              {exp.descriptions.map((desc, di) => (
                <div key={di} className="flex items-start gap-2">
                  <span style={{ color: 'var(--color-on-surface-variant)', marginTop: '0.5rem' }}>
                    •
                  </span>
                  <input
                    className={inputCls}
                    type="text"
                    value={desc}
                    aria-label={`Highlight ${di + 1}`}
                    onChange={(e) => updateDescription(i, di, e.target.value)}
                  />
                  <button
                    onClick={() => removeDescription(i, di)}
                    aria-label={`Remove highlight ${di + 1}`}
                    style={{ color: 'var(--color-on-surface-variant)', marginTop: '0.5rem' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => addDescription(i)}
                className="mt-3 text-xs font-medium transition-colors"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                + Add highlight
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EducationTab({
  profile,
  onChange,
}: {
  profile: MasterProfile;
  onChange: (patch: Partial<MasterProfile>) => void;
}) {
  const updateEntry = (index: number, patch: Partial<MasterProfile['education'][number]>) => {
    const updated = profile.education.map((e, i) => (i === index ? { ...e, ...patch } : e));
    onChange({ education: updated });
  };

  const addEntry = () => {
    onChange({
      education: [...profile.education, { school: '', degree: '' }],
    });
  };

  const removeEntry = (index: number) => {
    onChange({ education: profile.education.filter((_, i) => i !== index) });
  };

  return (
    <section className={sectionCls}>
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
        >
          Education
        </h2>
        <button
          onClick={addEntry}
          className="text-sm font-medium"
          style={{ color: 'var(--color-secondary)' }}
        >
          + Add Education
        </button>
      </div>
      <div className="space-y-6">
        {profile.education.map((edu, i) => (
          <div
            key={i}
            className="group relative rounded-[var(--radius-xl)] p-5"
            style={{ backgroundColor: 'var(--color-surface-container)' }}
          >
            <button
              aria-label="Remove education entry"
              onClick={() => removeEntry(i)}
              className="absolute right-4 top-4 text-sm opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              ×
            </button>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Institution">
                <input
                  className={inputCls}
                  type="text"
                  aria-label="Institution"
                  value={edu.school}
                  onChange={(e) => updateEntry(i, { school: e.target.value })}
                />
              </Field>
              <Field label="Degree">
                <input
                  className={inputCls}
                  type="text"
                  aria-label="Degree"
                  value={edu.degree}
                  onChange={(e) => updateEntry(i, { degree: e.target.value })}
                />
              </Field>
              <Field label="Field of Study">
                <input
                  className={inputCls}
                  type="text"
                  aria-label="Field of Study"
                  value={edu.fieldOfStudy ?? ''}
                  onChange={(e) => updateEntry(i, { fieldOfStudy: e.target.value })}
                />
              </Field>
              <Field label="Start Date">
                <input
                  className={inputCls}
                  type="date"
                  aria-label="Start Date"
                  value={edu.startDate ?? ''}
                  onChange={(e) => updateEntry(i, { startDate: e.target.value || undefined })}
                />
              </Field>
              <Field label="End Date">
                <input
                  className={inputCls}
                  type="date"
                  aria-label="End Date"
                  value={edu.endDate ?? ''}
                  onChange={(e) => updateEntry(i, { endDate: e.target.value || undefined })}
                />
              </Field>
              <Field label="GPA (optional)">
                <input
                  className={inputCls}
                  type="text"
                  aria-label="GPA"
                  value={edu.gpa ?? ''}
                  onChange={(e) => updateEntry(i, { gpa: e.target.value || undefined })}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectsTab({
  profile,
  onChange,
}: {
  profile: MasterProfile;
  onChange: (patch: Partial<MasterProfile>) => void;
}) {
  const projects = profile.projects ?? [];

  const updateEntry = (
    index: number,
    patch: Partial<NonNullable<MasterProfile['projects']>[number]>
  ) => {
    const updated = projects.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange({ projects: updated });
  };

  const addEntry = () => {
    onChange({ projects: [...projects, { name: '', technologies: [] }] });
  };

  const removeEntry = (index: number) => {
    onChange({ projects: projects.filter((_, i) => i !== index) });
  };

  return (
    <section className={sectionCls}>
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
        >
          Projects
        </h2>
        <button
          onClick={addEntry}
          className="text-sm font-medium"
          style={{ color: 'var(--color-secondary)' }}
        >
          + Add Project
        </button>
      </div>
      <div className="space-y-6">
        {projects.map((proj, i) => (
          <div
            key={i}
            className="group relative rounded-[var(--radius-xl)] p-5"
            style={{ backgroundColor: 'var(--color-surface-container)' }}
          >
            <button
              aria-label="Remove project entry"
              onClick={() => removeEntry(i)}
              className="absolute right-4 top-4 text-sm opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              ×
            </button>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Project Name">
                <input
                  className={inputCls}
                  type="text"
                  aria-label="Project Name"
                  value={proj.name}
                  onChange={(e) => updateEntry(i, { name: e.target.value })}
                />
              </Field>
              <Field label="URL">
                <input
                  className={inputCls}
                  type="url"
                  aria-label="Project URL"
                  value={proj.url ?? ''}
                  onChange={(e) => updateEntry(i, { url: e.target.value || undefined })}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className={inputCls + ' min-h-[80px] resize-y'}
                  aria-label="Project Description"
                  value={proj.description ?? ''}
                  onChange={(e) => updateEntry(i, { description: e.target.value || undefined })}
                />
              </Field>
              <Field label="Technologies (comma-separated)">
                <input
                  className={inputCls}
                  type="text"
                  aria-label="Technologies"
                  value={proj.technologies.join(', ')}
                  onChange={(e) =>
                    updateEntry(i, {
                      technologies: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CertificationsTab({
  profile,
  onChange,
}: {
  profile: MasterProfile;
  onChange: (patch: Partial<MasterProfile>) => void;
}) {
  const certs = profile.certifications ?? [];

  const updateEntry = (
    index: number,
    patch: Partial<NonNullable<MasterProfile['certifications']>[number]>
  ) => {
    const updated = certs.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange({ certifications: updated });
  };

  const addEntry = () => {
    onChange({ certifications: [...certs, { name: '' }] });
  };

  const removeEntry = (index: number) => {
    onChange({ certifications: certs.filter((_, i) => i !== index) });
  };

  return (
    <section className={sectionCls}>
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
        >
          Certifications
        </h2>
        <button
          onClick={addEntry}
          className="text-sm font-medium"
          style={{ color: 'var(--color-secondary)' }}
        >
          + Add Certification
        </button>
      </div>
      <div className="space-y-6">
        {certs.map((cert, i) => (
          <div
            key={i}
            className="group relative rounded-[var(--radius-xl)] p-5"
            style={{ backgroundColor: 'var(--color-surface-container)' }}
          >
            <button
              aria-label="Remove certification entry"
              onClick={() => removeEntry(i)}
              className="absolute right-4 top-4 text-sm opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              ×
            </button>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Certification Name">
                <input
                  className={inputCls}
                  type="text"
                  aria-label="Certification Name"
                  value={cert.name}
                  onChange={(e) => updateEntry(i, { name: e.target.value })}
                />
              </Field>
              <Field label="Issuer">
                <input
                  className={inputCls}
                  type="text"
                  aria-label="Issuer"
                  value={cert.issuer ?? ''}
                  onChange={(e) => updateEntry(i, { issuer: e.target.value || undefined })}
                />
              </Field>
              <Field label="Issued Date">
                <input
                  className={inputCls}
                  type="date"
                  aria-label="Issued Date"
                  value={cert.date ?? ''}
                  onChange={(e) => updateEntry(i, { date: e.target.value || undefined })}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RawJsonTab({ profile }: { profile: MasterProfile }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(profile, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={sectionCls}>
      <div className="mb-3 flex items-center justify-between">
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
        >
          Raw JSON
        </h2>
        <button
          onClick={handleCopy}
          className="rounded-[var(--radius-lg)] px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'var(--color-surface-container-high)',
            color: 'var(--color-on-surface)',
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        data-testid="raw-json-pre"
        className="overflow-auto rounded-[var(--radius-lg)] p-4 text-xs"
        style={{
          backgroundColor: 'var(--color-surface-container-highest)',
          color: 'var(--color-on-surface)',
          fontFamily: 'var(--font-mono, monospace)',
          maxHeight: '60vh',
        }}
      >
        {json}
      </pre>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

/** Profile page — loads MasterProfile from the service and provides a tabbed editor. */
export default function ProfilePage() {
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [savedProfile, setSavedProfile] = useState<MasterProfile | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      setSavedProfile(p);
    });
  }, []);

  const handleChange = useCallback((patch: Partial<MasterProfile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, ...patch };
    });
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaveStatus('saving');
    const saved = await saveProfile(profile);
    setSavedProfile(saved);
    setIsDirty(false);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleDiscard = async () => {
    const fresh = await getProfile();
    setProfile(fresh);
    setSavedProfile(fresh);
    setIsDirty(false);
  };

  if (!profile) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center text-sm"
        style={{ color: 'var(--color-on-surface-variant)' }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Page header */}
      <section className="flex flex-col gap-2">
        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          Master Profile / Source of Truth
        </span>
        <h1
          className="text-4xl font-bold"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
        >
          Your master profile
        </h1>
        <p className="mt-1 max-w-2xl text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          Edit your structured profile. Changes are local until you hit Save.
        </p>
      </section>

      {/* Tabbed editor */}
      <Tabs defaultValue="personal">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="rawjson">Raw JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalInfoTab profile={profile} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="summary">
          <SummaryTab profile={profile} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="skills">
          <SkillsTab profile={profile} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="experience">
          <ExperienceTab profile={profile} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="education">
          <EducationTab profile={profile} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="projects">
          <ProjectsTab profile={profile} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="certifications">
          <CertificationsTab profile={profile} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="rawjson">
          <RawJsonTab profile={profile} />
        </TabsContent>
      </Tabs>

      {/* Sticky footer action bar */}
      <div
        className="fixed bottom-0 right-0 z-40 flex w-full items-center justify-between px-10 py-4"
        style={{
          backgroundColor: 'var(--color-surface-container-low)',
          left: 'var(--sidebar-width)',
          width: 'calc(100% - var(--sidebar-width))',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleDiscard}
            disabled={!isDirty}
            className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            Discard changes
          </button>
          {saveStatus === 'saved' && (
            <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>
              Saved
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="rounded-[var(--radius-xl)] px-6 py-2 text-sm font-bold transition-colors disabled:opacity-40"
          style={{
            backgroundColor: 'var(--color-secondary)',
            color: 'var(--color-on-secondary)',
          }}
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
