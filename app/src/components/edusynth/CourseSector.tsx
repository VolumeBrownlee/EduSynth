import { useEduSynthStore, type Module } from '@/store/edusynth-store';
import { documentsApi } from '@/services/api';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ChevronLeft,
  FileText,
  Brain,
  Lock,
  Users,
  GraduationCap,
  ArrowRight,
  ClipboardCheck,
  Sparkles,
  Shield,
  Clock,
  MessageSquare,
  Search,
  Flame,
  Star,
  EyeOff,
  Upload,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReadyScoreGauge } from './ReadyScoreGauge';
import { LecturerUpload } from './LecturerUpload';
import { QuizModal } from './quiz-modal';
import { FlashcardViewer } from './flashcard-viewer';
import { useState } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const lastStudiedTimes = [
  { label: '2h ago' },
  { label: '5h ago' },
  { label: '1d ago' },
];

function getLastStudied(index: number): string {
  return lastStudiedTimes[index % lastStudiedTimes.length]?.label || '3d ago';
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= count ? 'text-accent fill-accent' : 'text-muted-foreground/60'}`}
        />
      ))}
    </div>
  );
}

function getStarCount(score: number): number {
  if (score >= 90) return 3;
  if (score >= 80) return 2;
  if (score >= 70) return 1;
  return 0;
}

/**
 * Card UI for a single document. Used by both the Study Material panel
 * (visible to everyone) and the Past Papers panel (lecturer-only).
 */
function DocumentCard({
  doc,
  onOpen,
  onDelete,
}: {
  doc: any;
  onOpen: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}) {
  const isRestricted = doc.tier === 'restricted';
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="relative flex items-start gap-3 p-3.5 rounded-xl bg-muted/20 hover:bg-accent/30 border border-border hover:border-primary/20 transition-all group text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
          isRestricted
            ? 'bg-accent/10 border-accent/20'
            : 'bg-primary/10 border-primary/20'
        }`}
      >
        <FileText className={`w-4 h-4 ${isRestricted ? 'text-accent' : 'text-primary'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
          {doc.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="outline"
            className={`text-2xs px-1.5 py-0 h-4 inline-flex items-center gap-1 ${
              isRestricted
                ? 'border-accent/30 text-accent bg-accent/5'
                : 'border-primary/30 text-primary bg-primary/5'
            }`}
          >
            {isRestricted ? <ClipboardCheck className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
            {isRestricted ? 'Past Paper' : 'Study Material'}
          </Badge>
          {(doc.page_count || doc.totalPages) ? (
            <div className="flex items-center gap-1 text-2xs text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              {doc.page_count || doc.totalPages} pages
            </div>
          ) : null}
        </div>
      </div>
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          title="Delete document"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive focus:opacity-100 focus:outline-none mt-0.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors mt-1" />
      )}
    </div>
  );
}

export function CourseSector() {
  const { selectedClassroom } = useEduSynthStore();
  if (!selectedClassroom) return <CourseList />;
  return <CourseDetail />;
}

function CourseList() {
  const { classrooms, setSelectedClassroom, studyProgress, profile } = useEduSynthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const isLecturer = profile?.role === 'lecturer' || profile?.role === 'teacher';

  const subjects = ['all', ...Array.from(new Set(classrooms.map((c) => c.subject).filter(Boolean))) as string[]];

  const filteredClassrooms = classrooms.filter((c) => {
    const matchesSearch =
      searchQuery === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterSubject === 'all' || c.subject === filterSubject;
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-5"
    >
      <LecturerUpload isOpen={showUpload} onClose={() => setShowUpload(false)} />

      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-info/10 flex items-center justify-center border border-primary/20">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Courses</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLecturer ? 'Manage your courses and upload materials' : 'Select a course to explore your skill tree'}
              </p>
            </div>
          </div>
          {isLecturer && (
            <Button
              onClick={() => setShowUpload(true)}
              className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 gap-1.5 text-xs h-9"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Materials
            </Button>
          )}
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl card-elevated border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setFilterSubject(subject)}
                className={`px-3 py-1.5 rounded-lg text-2xs font-medium transition-all ${
                  filterSubject === subject
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground bg-muted/30 border border-border'
                }`}
              >
                {subject === 'all' ? 'All' : subject}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClassrooms.map((classroom, classIdx) => {
          const classProgress = studyProgress.filter((p) => p.classroom_id === classroom.id);
          const classAvg =
            classProgress.length > 0
              ? Math.round(classProgress.reduce((s, p) => s + p.ready_score, 0) / classProgress.length)
              : 0;
          const completedCount = classProgress.filter((p) => p.ready_score >= 70).length;
          const totalModules = classroom.modules?.length || classProgress.length;

          return (
            <motion.div key={classroom.id} variants={itemVariants}>
              <Card
                className="card-elevated border-border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group overflow-hidden"
                onClick={() => setSelectedClassroom(classroom)}
                onMouseEnter={() => setHoveredCard(classroom.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className={`h-1 ${
                    classAvg >= 70
                      ? 'bg-gradient-to-r from-primary to-info'
                      : classAvg >= 40
                      ? 'bg-accent'
                      : 'bg-muted-foreground/30'
                  }`}
                />
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-info/10 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-transform border border-primary/10">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate text-sm">
                          {classroom.name}
                        </h3>
                        {classIdx === 0 && (
                          <Badge className="bg-accent/15 text-accent border-accent/30 text-2xs px-1.5 py-0 h-4 shrink-0">
                            <Flame className="w-2.5 h-2.5 mr-0.5" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {classroom.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-2xs border-border text-muted-foreground bg-muted/20 px-1.5">
                      <GraduationCap className="w-2.5 h-2.5 mr-0.5" />
                      {classroom.lecturer_name || 'Lecturer'}
                    </Badge>
                    <Badge variant="outline" className="text-2xs border-border text-muted-foreground bg-muted/20 px-1.5">
                      <Users className="w-2.5 h-2.5 mr-0.5" />
                      {classroom.member_count || 0} scholars
                    </Badge>
                    <Badge variant="outline" className="text-2xs border-border text-muted-foreground bg-muted/20 px-1.5">
                      <Shield className="w-2.5 h-2.5 mr-0.5" />
                      {classroom.documents?.length || 0} docs
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-muted-foreground font-medium">
                        {completedCount}/{totalModules} mastered
                      </span>
                      <span className="text-2xs text-muted-foreground/50 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {getLastStudied(classIdx)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            classAvg >= 70
                              ? 'bg-gradient-to-r from-primary to-info'
                              : classAvg >= 40
                              ? 'bg-accent'
                              : 'bg-muted-foreground/40'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${classAvg}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <span className="text-2xs text-foreground tabular-nums font-medium">{classAvg}%</span>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredClassrooms.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="card-elevated border-border p-8 text-center">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No courses found</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Try adjusting your search or filter</p>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

// ===== SVG Candy Crush Skill Tree =====
function SvgSkillTree({
  modules,
  classProgress,
  selectedModuleId,
  onSelectModule,
}: {
  modules: Module[];
  classProgress: any[];
  selectedModuleId: string | null;
  onSelectModule: (mod: Module) => void;
}) {
  const nodeSpacing = 160;
  const verticalAmplitude = 50;
  const nodeRadius = 30;
  const svgWidth = Math.max(800, modules.length * nodeSpacing + 120);
  const svgHeight = 220;
  const centerY = svgHeight / 2;

  const nodes = modules.map((mod, index) => {
    const progress = classProgress.find((p: any) => p.module_id === mod.id);
    const score = progress?.ready_score || 0;
    const isCompleted = score >= 70;
    const isInProgress = score > 0 && score < 70;

    let isLocked = false;
    if (index > 0) {
      const prevProgress = classProgress.find((p: any) => p.module_id === modules[index - 1].id);
      isLocked = !prevProgress || prevProgress.ready_score < 70;
    }

    const x = 80 + index * nodeSpacing;
    const y = centerY + (index % 2 === 0 ? -verticalAmplitude : verticalAmplitude);
    const stars = getStarCount(score);

    return { mod, index, x, y, score, isCompleted, isInProgress, isLocked, stars };
  });

  return (
    <div className="overflow-x-auto pb-2 scrollbar-none">
      <svg width={svgWidth} height={svgHeight} className="mx-auto" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <defs>
          <filter id="glow-completed" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-star" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="path-active-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--info))" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="path-progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Connection paths */}
        {nodes.map((node, i) => {
          if (i === 0) return null;
          const prev = nodes[i - 1];
          const pathStroke = node.isLocked
            ? 'rgba(113,113,122,0.15)'
            : prev.isCompleted
            ? 'url(#path-active-grad)'
            : 'url(#path-progress-grad)';

          return (
            <motion.path
              key={`path-${i}`}
              d={`M ${prev.x} ${prev.y} Q ${(prev.x + node.x) / 2} ${
                (prev.y + node.y) / 2 + (i % 2 === 0 ? -25 : 25)
              } ${node.x} ${node.y}`}
              fill="none"
              stroke={pathStroke}
              strokeWidth={node.isLocked ? 2 : 3.5}
              strokeDasharray={node.isLocked ? '8 6' : 'none'}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const { mod, x, y, score, isCompleted, isInProgress, isLocked, stars } = node;
          return (
            <motion.g
              key={mod.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.12, type: 'spring', stiffness: 200 }}
              onClick={() => !isLocked && onSelectModule(mod)}
              className={isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
              style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
            >
              {isCompleted && (
                <>
                  <circle cx={x} cy={y} r={nodeRadius + 12} fill="hsl(var(--primary))" opacity={0.06}>
                    <animate
                      attributeName="r"
                      values={`${nodeRadius + 8};${nodeRadius + 16};${nodeRadius + 8}`}
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                    <animate attributeName="opacity" values="0.06;0.02;0.06" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r={nodeRadius + 6} fill="none" stroke="hsl(var(--primary))" strokeWidth={1.5} opacity={0.4}>
                    <animate
                      attributeName="r"
                      values={`${nodeRadius + 5};${nodeRadius + 9};${nodeRadius + 5}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                </>
              )}

              {isInProgress && (
                <>
                  <circle cx={x} cy={y} r={nodeRadius + 10} fill="hsl(var(--accent))" opacity={0.05}>
                    <animate
                      attributeName="r"
                      values={`${nodeRadius + 6};${nodeRadius + 14};${nodeRadius + 6}`}
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                    <animate attributeName="opacity" values="0.05;0.01;0.05" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r={nodeRadius + 5} fill="none" stroke="hsl(var(--accent))" strokeWidth={2} opacity={0.5}>
                    <animate
                      attributeName="r"
                      values={`${nodeRadius + 3};${nodeRadius + 8};${nodeRadius + 3}`}
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                    <animate attributeName="opacity" values="0.5;0.15;0.5" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </>
              )}

              {isLocked && <circle cx={x} cy={y} r={nodeRadius + 4} fill="rgba(63,63,70,0.15)" />}

              <circle
                cx={x}
                cy={y}
                r={nodeRadius}
                fill={isCompleted ? 'hsl(var(--primary))' : isInProgress ? 'hsl(var(--accent))' : isLocked ? 'hsl(var(--muted))' : 'hsl(var(--card))'}
                stroke={
                  isCompleted ? 'hsl(var(--primary) / 0.7)' : isInProgress ? 'hsl(var(--accent))' : isLocked ? 'hsl(var(--border))' : 'hsl(var(--muted-foreground) / 0.5)'
                }
                strokeWidth={isLocked ? 1.5 : 2.5}
                opacity={isLocked ? 0.45 : 1}
                filter={isCompleted ? 'url(#glow-completed)' : undefined}
              />

              {isCompleted && (
                <circle cx={x} cy={y} r={nodeRadius - 6} fill="none" stroke="rgba(9,9,11,0.3)" strokeWidth={1} />
              )}

              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isCompleted ? 'hsl(var(--primary-foreground))' : isLocked ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'}
                fontSize={isCompleted ? '14' : '12'}
                fontWeight="bold"
                fontFamily="system-ui"
              >
                {isLocked ? '🔒' : isCompleted ? '✓' : `${i + 1}`}
              </text>

              {isCompleted && stars > 0 && (
                <g transform={`translate(${x - 22}, ${y - nodeRadius - 22})`} filter="url(#glow-star)">
                  {[1, 2, 3].map((starIdx) => (
                    <text
                      key={starIdx}
                      x={(starIdx - 1) * 15}
                      y={0}
                      fontSize={starIdx <= stars ? '14' : '10'}
                      fill={starIdx <= stars ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground) / 0.4)'}
                      opacity={starIdx <= stars ? 1 : 0.3}
                      fontWeight={starIdx <= stars ? 'bold' : 'normal'}
                    >
                      ★
                    </text>
                  ))}
                </g>
              )}

              {score > 0 && !isLocked && (
                <>
                  <rect
                    x={x - 16}
                    y={y + nodeRadius + 5}
                    width={32}
                    height={16}
                    rx={5}
                    fill={isCompleted ? 'rgba(45,212,191,0.12)' : 'rgba(245,158,11,0.12)'}
                    stroke={isCompleted ? 'rgba(45,212,191,0.2)' : 'rgba(245,158,11,0.2)'}
                    strokeWidth={0.5}
                  />
                  <text
                    x={x}
                    y={y + nodeRadius + 15}
                    textAnchor="middle"
                    fill={isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}
                    fontSize={9}
                    fontWeight="bold"
                    fontFamily="system-ui"
                  >
                    {Math.round(score)}%
                  </text>
                </>
              )}

              <text
                x={x}
                y={y + nodeRadius + (score > 0 && !isLocked ? 32 : 16)}
                textAnchor="middle"
                fill={isLocked ? 'hsl(var(--muted-foreground) / 0.6)' : isCompleted ? 'hsl(var(--primary))' : isInProgress ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))'}
                fontSize={10}
                fontWeight={isCompleted || isInProgress ? '600' : '500'}
                fontFamily="system-ui"
              >
                {mod.name.length > 16 ? mod.name.slice(0, 14) + '…' : mod.name}
              </text>

              {selectedModuleId === mod.id && !isLocked && (
                <circle cx={x} cy={y} r={nodeRadius + 4} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="4 2">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${x} ${y}`}
                    to={`360 ${x} ${y}`}
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </motion.g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Mastered</span>
          <Star className="w-2.5 h-2.5 text-accent fill-accent" />
        </div>
        <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/30 border border-border" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-muted border border-border opacity-50" />
          <span>Locked (70%+ needed)</span>
        </div>
      </div>
    </div>
  );
}

function CourseDetail() {
  const {
    selectedClassroom,
    setSelectedClassroom,
    studyProgress,
    setCurrentView,
    setSelectedModule,
    setSelectedDocument,
    submitQuizResult,
    initializeData,
    addToast,
    profile,
  } = useEduSynthStore();

  const [quizTarget, setQuizTarget] = useState<{ moduleId: string; subject: string; topic: string } | null>(null);
  const [flashcardTarget, setFlashcardTarget] = useState<{ subject: string; topic: string } | null>(null);
  const [selectedSkillNode, setSelectedSkillNode] = useState<Module | null>(null);

  if (!selectedClassroom) return null;

  const modules: Module[] = selectedClassroom.modules || [];
  const documents = selectedClassroom.documents || [];
  const classProgress = studyProgress.filter((p) => p.classroom_id === selectedClassroom.id);

  const isLecturer = profile?.role === 'lecturer' || profile?.role === 'teacher';
  // Two separate panels: study material is for everyone; past papers are a
  // lecturer-only panel that students never see (and the AI uses for Sample
  // Exam generation).
  const studyMaterial = documents.filter((doc: any) => doc.tier !== 'restricted');
  const pastPapers = isLecturer
    ? documents.filter((doc: any) => doc.tier === 'restricted')
    : [];

  const handleDeleteDocument = async (doc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const tierLabel = doc.tier === 'restricted' ? 'past paper' : 'document';
    if (!window.confirm(`Delete the ${tierLabel}"${doc.title}"? Students will lose access immediately.`)) return;
    try {
      await documentsApi.delete(doc.id);
      addToast({ type: 'success', title: 'Document deleted', message: `"${doc.title}" was removed.` });
      // Re-pull documents + classrooms so the card disappears and any quiz/sample-exam path stays in sync
      await initializeData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Try again.';
      addToast({ type: 'warning', title: 'Could not delete', message: msg });
    }
  };

  const handleQuizComplete = (correct: number, total: number) => {
    if (quizTarget) {
      // Persist the attempt; the store then re-syncs progress, XP and achievements
      submitQuizResult({
        subject: quizTarget.subject,
        topic: quizTarget.topic,
        difficulty: 'intermediate',
        correctAnswers: correct,
        totalQuestions: total,
        classroomId: selectedClassroom.id,
        quizTitle: `${quizTarget.topic} Quiz`,
      });
    }
    setQuizTarget(null);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-4"
    >
      {quizTarget && (
        <QuizModal
          subject={quizTarget.subject}
          topic={quizTarget.topic}
          onClose={() => setQuizTarget(null)}
          onComplete={handleQuizComplete}
        />
      )}

      {flashcardTarget && (
        <FlashcardViewer
          subject={flashcardTarget.subject}
          topic={flashcardTarget.topic}
          onClose={() => setFlashcardTarget(null)}
        />
      )}

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedClassroom(null)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">{selectedClassroom.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{selectedClassroom.description}</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-2xs">
          <GraduationCap className="w-3 h-3 mr-1" />
          {selectedClassroom.lecturer_name}
        </Badge>
        {isLecturer && (
          <Badge className="bg-lecturer/10 text-lecturer border-lecturer/20 text-2xs inline-flex items-center gap-1">
            <Users className="w-3 h-3" />
            Lecturer View
          </Badge>
        )}
      </motion.div>

      {/* Skill Tree */}
      <motion.div variants={itemVariants}>
        <Card className="card-elevated border-border overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Skill Tree — Path to Mastery
              </CardTitle>
              <span className="text-2xs text-muted-foreground">
                {classProgress.filter((p) => p.ready_score >= 70).length}/{modules.length} completed
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No modules yet</p>
                <p className="text-2xs text-muted-foreground/50 mt-1">
                  {isLecturer ? 'Add modules to build the skill tree' : 'Your lecturer is building the curriculum'}
                </p>
              </div>
            ) : (
              <>
                <SvgSkillTree
                  modules={modules}
                  classProgress={classProgress}
                  selectedModuleId={selectedSkillNode?.id || null}
                  onSelectModule={setSelectedSkillNode}
                />

                {selectedSkillNode && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl card-elevated border border-border"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">{selectedSkillNode.name}</span>
                        {(() => {
                          const progress = classProgress.find((p) => p.module_id === selectedSkillNode.id);
                          const score = progress?.ready_score || 0;
                          return score > 0 ? (
                            <Badge
                              className={`text-2xs ${
                                score >= 70
                                  ? 'bg-primary/10 text-primary border-primary/20'
                                  : 'bg-accent/10 text-accent border-accent/20'
                              }`}
                            >
                              {Math.round(score)}% • {score >= 70 ? `${getStarCount(score)} ★` : 'In Progress'}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedModule(selectedSkillNode);
                            if (studyMaterial.length > 0) setSelectedDocument(studyMaterial[0]);
                            setCurrentView('neural-lab');
                          }}
                          className="flex items-center gap-1 text-2xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/10"
                        >
                          <Brain className="w-2.5 h-2.5" />
                          Study
                        </button>
                        <button
                          onClick={() => setQuizTarget({
                            moduleId: selectedSkillNode.id,
                            subject: selectedClassroom.subject || selectedClassroom.name,
                            topic: selectedSkillNode.name,
                          })}
                          className="flex items-center gap-1 text-2xs px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors border border-accent/10"
                        >
                          <ClipboardCheck className="w-2.5 h-2.5" />
                          Quiz
                        </button>
                        <button
                          onClick={() => setFlashcardTarget({
                            subject: selectedClassroom.subject || selectedClassroom.name,
                            topic: selectedSkillNode.name,
                          })}
                          className="flex items-center gap-1 text-2xs px-2.5 py-1.5 rounded-lg bg-lecturer/10 text-lecturer hover:bg-lecturer/20 transition-colors border border-lecturer/10"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          Flashcards
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Study Material — visible to students and lecturers */}
      <motion.div variants={itemVariants}>
        <Card className="card-elevated border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Study Material
              </CardTitle>
              <Badge className="bg-muted text-muted-foreground border-border text-2xs">
                <Shield className="w-2.5 h-2.5 mr-0.5" />
                Protected
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {studyMaterial.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No study material yet</p>
                <p className="text-2xs text-muted-foreground/50 mt-1">
                  {isLecturer
                    ? 'Upload notes or a textbook to get started'
                    :"Your lecturer hasn't shared any material yet"}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {studyMaterial.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onOpen={() => {
                      setSelectedDocument(doc);
                      if (modules.length > 0) setSelectedModule(modules[0]);
                      setCurrentView('neural-lab');
                    }}
                    onDelete={isLecturer ? (e) => handleDeleteDocument(doc, e) : undefined}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Past Papers — LECTURER ONLY. Students never see this panel. */}
      {isLecturer && (
        <motion.div variants={itemVariants}>
          <Card className="card-elevated border-accent/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm text-foreground flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-accent" />
                  Past Papers
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-accent/10 text-accent border-accent/30 text-2xs">
                    <EyeOff className="w-2.5 h-2.5 mr-0.5" />
                    Students cannot see these
                  </Badge>
                </div>
              </div>
              <p className="text-2xs text-muted-foreground mt-1">
                The AI uses these only as a structural reference when generating Sample Exam papers — they are never shown to students.
              </p>
            </CardHeader>
            <CardContent>
              {pastPapers.length === 0 ? (
                <div className="text-center py-6">
                  <ClipboardCheck className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No past papers uploaded</p>
                  <p className="text-2xs text-muted-foreground/50 mt-1">
                    Upload one and Sample Exam will mirror its structure.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pastPapers.map((doc: any) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onOpen={() => {
                        setSelectedDocument(doc);
                        if (modules.length > 0) setSelectedModule(modules[0]);
                        setCurrentView('neural-lab');
                      }}
                      onDelete={(e) => handleDeleteDocument(doc, e)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Module Performance Grid */}
      {modules.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="card-elevated border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" />
                Module Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {modules.map((mod) => {
                  const progress = classProgress.find((p) => p.module_id === mod.id);
                  const score = progress?.ready_score || 0;
                  const isCompleted = score >= 70;
                  const modIndex = modules.findIndex((m) => m.id === mod.id);
                  let isLocked = false;
                  if (modIndex > 0) {
                    const prevProgress = classProgress.find((p) => p.module_id === modules[modIndex - 1].id);
                    isLocked = !prevProgress || prevProgress.ready_score < 70;
                  }

                  return (
                    <div
                      key={mod.id}
                      className={`text-center p-3 rounded-xl border transition-colors ${
                        isLocked
                          ? 'bg-muted/10 border-border opacity-50'
                          : 'bg-muted/20 border-border hover:border-primary/20'
                      }`}
                    >
                      <ReadyScoreGauge score={isLocked ? 0 : score} size={80} />
                      <p className="text-2xs text-foreground mt-2 truncate font-medium">
                        {isLocked ? (
                          <Lock className="w-3 h-3 text-muted-foreground mx-auto" />
                        ) : (
                          mod.name
                        )}
                      </p>
                      {!isLocked && (
                        <div className="flex items-center justify-center gap-3 mt-1.5 text-2xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {progress?.queries_count || 0}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {progress?.time_spent_minutes || 0}m
                          </span>
                        </div>
                      )}
                      {isCompleted && (
                        <div className="mt-1.5 flex justify-center">
                          <Stars count={getStarCount(score)} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
