import { useEduSynthStore, type Module } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ChevronLeft,
  FileText,
  Brain,
  Lock,
  CheckCircle2,
  Circle,
  Loader2,
  Users,
  GraduationCap,
  ArrowRight,
  ClipboardCheck,
  Sparkles,
  Shield,
  Clock,
  MessageSquare,
  Search,
  TrendingUp,
  Flame,
  Star,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReadyScoreGauge } from './ready-score-gauge';
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

// Simulated "last studied" timestamps
const lastStudiedTimes = [
  { classroomId: 0, label: '2h ago' },
  { classroomId: 1, label: '5h ago' },
  { classroomId: 2, label: '1d ago' },
];

function getLastStudied(index: number): string {
  return lastStudiedTimes[index % lastStudiedTimes.length]?.label || '3d ago';
}

// Star component for completed nodes
function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= count ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-zinc-700'}`}
        />
      ))}
    </div>
  );
}

// Get star count based on ready_score
function getStarCount(score: number): number {
  if (score >= 90) return 3;
  if (score >= 80) return 2;
  if (score >= 70) return 1;
  return 0;
}

export function CourseSector() {
  const { selectedClassroom } = useEduSynthStore();

  if (!selectedClassroom) {
    return <CourseList />;
  }

  return <CourseDetail />;
}

function CourseList() {
  const { classrooms, setSelectedClassroom, studyProgress } = useEduSynthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const filteredClassrooms = classrooms.filter((c) => {
    const matchesSearch = searchQuery === '' ||
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
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2DD4BF]/20 to-[#06B6D4]/10 flex items-center justify-center border border-[#2DD4BF]/20">
            <BookOpen className="w-5 h-5 text-[#2DD4BF]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Course Sector</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Select a course to explore modules and documents</p>
          </div>
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
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#2DD4BF]/30 focus:ring-1 focus:ring-[#2DD4BF]/20"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {['all', 'Computer Science', 'Mathematics', 'Statistics'].map((subject) => (
              <button
                key={subject}
                onClick={() => setFilterSubject(subject)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  filterSubject === subject
                    ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20'
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
          const classAvg = classProgress.length > 0
            ? Math.round(classProgress.reduce((s, p) => s + p.ready_score, 0) / classProgress.length)
            : 0;
          const completedCount = classProgress.filter((p) => p.ready_score >= 70).length;
          const totalModules = (classroom as any).modules?.length || classProgress.length;
          const isHovered = hoveredCard === classroom.id;
          const isFirst = classIdx === 0;

          return (
            <motion.div key={classroom.id} variants={itemVariants}>
              <Card
                className={`glass border-border hover:border-[#2DD4BF]/20 hover:shadow-lg hover:shadow-[#2DD4BF]/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group overflow-hidden card-lift`}
                onClick={() => setSelectedClassroom(classroom)}
                onMouseEnter={() => setHoveredCard(classroom.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Top accent bar */}
                <div className={`h-1 ${
                  classAvg >= 70 ? 'bg-gradient-to-r from-[#2DD4BF] to-[#06B6D4]' : classAvg >= 40 ? 'bg-[#F59E0B]' : 'bg-zinc-700'
                }`} />
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2DD4BF]/15 to-[#06B6D4]/10 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-transform border border-[#2DD4BF]/10">
                      <BookOpen className="w-5 h-5 text-[#2DD4BF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground group-hover:text-[#2DD4BF] transition-colors truncate text-sm">
                          {classroom.name}
                        </h3>
                        {isFirst && (
                          <Badge className="bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30 text-[8px] px-1.5 py-0 h-4 shrink-0">
                            <Flame className="w-2.5 h-2.5 mr-0.5" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{classroom.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[9px] border-border text-muted-foreground bg-muted/20 px-1.5">
                      <GraduationCap className="w-2.5 h-2.5 mr-0.5" />
                      {(classroom as any).lecturer_name || 'Lecturer'}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] border-border text-muted-foreground bg-muted/20 px-1.5">
                      <Users className="w-2.5 h-2.5 mr-0.5" />
                      {(classroom as any).member_count || 0} scholars
                    </Badge>
                    <Badge variant="outline" className="text-[9px] border-border text-muted-foreground bg-muted/20 px-1.5">
                      <Shield className="w-2.5 h-2.5 mr-0.5" />
                      {(classroom as any).documents?.length || 0} docs
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-medium">{completedCount}/{totalModules} mastered</span>
                      <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {getLastStudied(classIdx)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            classAvg >= 70 ? 'bg-gradient-to-r from-[#2DD4BF] to-[#06B6D4]' : classAvg >= 40 ? 'bg-[#F59E0B]' : 'bg-zinc-600'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${classAvg}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <span className="text-[10px] text-foreground tabular-nums font-medium">{classAvg}%</span>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-[#2DD4BF] group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredClassrooms.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="glass border-border p-8 text-center">
            <Search className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No courses found</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Try adjusting your search or filter</p>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

// ====== SVG CANDY CRUSH SKILL TREE ======
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
  // Calculate node positions in a zigzag/Candy Crush path
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

    // Locking: a module is locked if its previous sibling hasn't reached 70%
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
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="1" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="path-progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {/* Connection paths between nodes */}
        {nodes.map((node, i) => {
          if (i === 0) return null;
          const prev = nodes[i - 1];
          const pathStroke = node.isLocked ? 'rgba(113,113,122,0.15)' : prev.isCompleted ? 'url(#path-active-grad)' : 'url(#path-progress-grad)';
          const dashArray = node.isLocked ? '8 6' : 'none';

          return (
            <motion.path
              key={`path-${i}`}
              d={`M ${prev.x} ${prev.y} Q ${(prev.x + node.x) / 2} ${(prev.y + node.y) / 2 + (i % 2 === 0 ? -25 : 25)} ${node.x} ${node.y}`}
              fill="none"
              stroke={pathStroke}
              strokeWidth={node.isLocked ? 2 : 3.5}
              strokeDasharray={dashArray}
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
              {/* Glow effect for completed nodes */}
              {isCompleted && (
                <>
                  <circle cx={x} cy={y} r={nodeRadius + 12} fill="#2DD4BF" opacity={0.06}>
                    <animate attributeName="r" values={`${nodeRadius + 8};${nodeRadius + 16};${nodeRadius + 8}`} dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.06;0.02;0.06" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r={nodeRadius + 6} fill="none" stroke="#2DD4BF" strokeWidth={1.5} opacity={0.4}>
                    <animate attributeName="r" values={`${nodeRadius + 5};${nodeRadius + 9};${nodeRadius + 5}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                </>
              )}

              {/* Pulse for in-progress */}
              {isInProgress && (
                <>
                  <circle cx={x} cy={y} r={nodeRadius + 10} fill="#F59E0B" opacity={0.05}>
                    <animate attributeName="r" values={`${nodeRadius + 6};${nodeRadius + 14};${nodeRadius + 6}`} dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.05;0.01;0.05" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r={nodeRadius + 5} fill="none" stroke="#F59E0B" strokeWidth={2} opacity={0.5}>
                    <animate attributeName="r" values={`${nodeRadius + 3};${nodeRadius + 8};${nodeRadius + 3}`} dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0.15;0.5" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </>
              )}

              {/* Main circle background glow for locked */}
              {isLocked && (
                <circle cx={x} cy={y} r={nodeRadius + 4} fill="rgba(63,63,70,0.15)" />
              )}

              {/* Main circle */}
              <circle
                cx={x}
                cy={y}
                r={nodeRadius}
                fill={
                  isCompleted ? '#2DD4BF' :
                  isInProgress ? '#F59E0B' :
                  isLocked ? '#27272A' :
                  '#1C1C1E'
                }
                stroke={
                  isCompleted ? '#5EEAD4' :
                  isInProgress ? '#FBBF24' :
                  isLocked ? '#3F3F46' :
                  '#52525B'
                }
                strokeWidth={isLocked ? 1.5 : 2.5}
                opacity={isLocked ? 0.45 : 1}
                filter={isCompleted ? 'url(#glow-completed)' : undefined}
              />

              {/* Inner circle decoration for completed */}
              {isCompleted && (
                <circle cx={x} cy={y} r={nodeRadius - 6} fill="none" stroke="rgba(9,9,11,0.3)" strokeWidth={1} />
              )}

              {/* Module number */}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isCompleted ? '#09090B' : isLocked ? '#71717A' : '#FAFAFA'}
                fontSize={isCompleted ? '14' : '12'}
                fontWeight="bold"
                fontFamily="system-ui"
              >
                {isLocked ? '🔒' : isCompleted ? '✓' : `${i + 1}`}
              </text>

              {/* Stars above completed nodes */}
              {isCompleted && stars > 0 && (
                <g transform={`translate(${x - 22}, ${y - nodeRadius - 22})`} filter="url(#glow-star)">
                  {[1, 2, 3].map((starIdx) => (
                    <text
                      key={starIdx}
                      x={(starIdx - 1) * 15}
                      y={0}
                      fontSize={starIdx <= stars ? '14' : '10'}
                      fill={starIdx <= stars ? '#F59E0B' : '#52525B'}
                      opacity={starIdx <= stars ? 1 : 0.3}
                      fontWeight={starIdx <= stars ? 'bold' : 'normal'}
                    >
                      ★
                    </text>
                  ))}
                </g>
              )}

              {/* Score badge */}
              {score > 0 && !isLocked && (
                <>
                  <rect x={x - 16} y={y + nodeRadius + 5} width={32} height={16} rx={5} fill={isCompleted ? 'rgba(45,212,191,0.12)' : 'rgba(245,158,11,0.12)'} stroke={isCompleted ? 'rgba(45,212,191,0.2)' : 'rgba(245,158,11,0.2)'} strokeWidth={0.5} />
                  <text x={x} y={y + nodeRadius + 15} textAnchor="middle" fill={isCompleted ? '#2DD4BF' : '#F59E0B'} fontSize={9} fontWeight="bold" fontFamily="system-ui">
                    {Math.round(score)}%
                  </text>
                </>
              )}

              {/* Module name below */}
              <text
                x={x}
                y={y + nodeRadius + (score > 0 && !isLocked ? 32 : 16)}
                textAnchor="middle"
                fill={isLocked ? '#52525B' : isCompleted ? '#5EEAD4' : isInProgress ? '#FBBF24' : '#A1A1AA'}
                fontSize={10}
                fontWeight={isCompleted || isInProgress ? '600' : '500'}
                fontFamily="system-ui"
              >
                {mod.name.length > 16 ? mod.name.slice(0, 14) + '…' : mod.name}
              </text>

              {/* Selected ring */}
              {selectedModuleId === mod.id && !isLocked && (
                <circle cx={x} cy={y} r={nodeRadius + 4} fill="none" stroke="#2DD4BF" strokeWidth={2} strokeDasharray="4 2">
                  <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="4s" repeatCount="indefinite" />
                </circle>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-[#2DD4BF]" />
          <span>Mastered</span>
          <Star className="w-2.5 h-2.5 text-[#F59E0B] fill-[#F59E0B]" />
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-zinc-700 border border-zinc-600" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700 opacity-50" />
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
    profile,
  } = useEduSynthStore();

  const [quizModule, setQuizModule] = useState<string | null>(null);
  const [flashcardModule, setFlashcardModule] = useState<string | null>(null);
  const [selectedSkillNode, setSelectedSkillNode] = useState<Module | null>(null);

  if (!selectedClassroom) return null;

  const modules: Module[] = (selectedClassroom as any).modules || [];
  const documents = (selectedClassroom as any).documents || [];
  const classProgress = studyProgress.filter((p) => p.classroom_id === selectedClassroom.id);

  // RBAC: Students cannot see exam/restricted documents
  const isLecturer = profile?.role === 'lecturer';
  const visibleDocuments = isLecturer
    ? documents
    : documents.filter((doc: any) => doc.category !== 'exam');

  const handleQuizComplete = (score: number) => {
    if (profile && quizModule) {
      const currentProgress = classProgress.find((p) => p.module_id === quizModule);
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          classroom_id: selectedClassroom.id,
          module_id: quizModule,
          quiz_avg: score,
          interaction_depth: currentProgress?.interaction_depth || 0,
          queries_count: currentProgress?.queries_count || 0,
        }),
      }).catch(() => {});
    }
    setQuizModule(null);
  };

  const handleSkillNodeSelect = (mod: Module) => {
    setSelectedSkillNode(mod);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-4"
    >
      {/* Quiz Modal */}
      {quizModule && (
        <QuizModal
          moduleName={quizModule}
          onClose={() => setQuizModule(null)}
          onComplete={handleQuizComplete}
        />
      )}

      {/* Flashcard Viewer */}
      {flashcardModule && (
        <FlashcardViewer
          moduleName={flashcardModule}
          onClose={() => setFlashcardModule(null)}
        />
      )}

      {/* Back Button + Header */}
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
        <Badge className="bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/20 text-[10px]">
          <GraduationCap className="w-3 h-3 mr-1" />
          {(selectedClassroom as any).lecturer_name}
        </Badge>
        {isLecturer && (
          <Badge className="bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20 text-[10px]">
            👨‍🏫 Lecturer View
          </Badge>
        )}
      </motion.div>

      {/* SVG Candy Crush Skill Tree */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border glow-teal overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#2DD4BF]" />
                Skill Tree — Path to Mastery
              </CardTitle>
              <span className="text-[10px] text-muted-foreground">
                {classProgress.filter((p) => p.ready_score >= 70).length}/{modules.length} completed
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <SvgSkillTree
              modules={modules}
              classProgress={classProgress}
              selectedModuleId={selectedSkillNode?.id || null}
              onSelectModule={handleSkillNodeSelect}
            />

            {/* Selected Node Actions */}
            {selectedSkillNode && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl glass border border-border"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#2DD4BF]" />
                    <span className="text-xs font-medium text-foreground">{selectedSkillNode.name}</span>
                    {(() => {
                      const progress = classProgress.find((p) => p.module_id === selectedSkillNode.id);
                      const score = progress?.ready_score || 0;
                      return score > 0 ? (
                        <Badge className={`text-[9px] ${score >= 70 ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/20' : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'}`}>
                          {Math.round(score)}% • {score >= 70 ? `${getStarCount(score)} ★` : 'In Progress'}
                        </Badge>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedModule(selectedSkillNode);
                        if (visibleDocuments.length > 0) {
                          setSelectedDocument(visibleDocuments[0]);
                        }
                        setCurrentView('neural-lab');
                      }}
                      className="flex items-center gap-1 text-[9px] px-2.5 py-1.5 rounded-lg bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 transition-colors border border-[#2DD4BF]/10"
                    >
                      <Brain className="w-2.5 h-2.5" />
                      Study
                    </button>
                    <button
                      onClick={() => setQuizModule(selectedSkillNode.id)}
                      className="flex items-center gap-1 text-[9px] px-2.5 py-1.5 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-colors border border-[#F59E0B]/10"
                    >
                      <ClipboardCheck className="w-2.5 h-2.5" />
                      Quiz
                    </button>
                    <button
                      onClick={() => setFlashcardModule(selectedSkillNode.name)}
                      className="flex items-center gap-1 text-[9px] px-2.5 py-1.5 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition-colors border border-[#8B5CF6]/10"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Flashcards
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Documents — RBAC filtered */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2DD4BF]" />
                Secure Documents
              </CardTitle>
              <div className="flex items-center gap-2">
                {isLecturer && documents.length !== visibleDocuments.length && (
                  <Badge className="bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20 text-[8px]">
                    <EyeOff className="w-2.5 h-2.5 mr-0.5" />
                    {documents.length - visibleDocuments.length} restricted (hidden from students)
                  </Badge>
                )}
                <Badge className="bg-muted text-muted-foreground border-border text-[9px]">
                  <Shield className="w-2.5 h-2.5 mr-0.5" />
                  Vault Protected
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {visibleDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No documents available</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {isLecturer ? 'Upload documents to get started' : 'Your lecturer hasn\'t shared any documents yet'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleDocuments.map((doc: any) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocument(doc);
                      if (modules.length > 0) {
                        setSelectedModule(modules[0]);
                      }
                      setCurrentView('neural-lab');
                    }}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/20 hover:bg-accent/30 border border-border hover:border-[#2DD4BF]/20 transition-all group text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      doc.category === 'exam'
                        ? 'bg-[#F59E0B]/10 border-[#F59E0B]/20'
                        : 'bg-[#2DD4BF]/10 border-[#2DD4BF]/20'
                    }`}>
                      <FileText className={`w-4 h-4 ${
                        doc.category === 'exam' ? 'text-[#F59E0B]' : 'text-[#2DD4BF]'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground group-hover:text-[#2DD4BF] transition-colors truncate">
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[8px] px-1 py-0 h-4 ${
                          doc.category === 'exam'
                            ? 'border-[#F59E0B]/30 text-[#F59E0B] bg-[#F59E0B]/5'
                            : 'border-[#2DD4BF]/30 text-[#2DD4BF] bg-[#2DD4BF]/5'
                        }`}>
                          {doc.category === 'exam' ? '📋 Restricted' : '📚 Textbook'}
                        </Badge>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />
                          {doc.page_count} pages
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-[#2DD4BF] transition-colors mt-1" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Module Details */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              Module Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {modules.map((mod) => {
                const progress = classProgress.find((p) => p.module_id === mod.id);
                const score = progress?.ready_score || 0;
                const isCompleted = score >= 70;
                const isInProgress = score > 0 && score < 70;

                // Locking logic
                const modIndex = modules.findIndex((m) => m.id === mod.id);
                let isLocked = false;
                if (modIndex > 0) {
                  const prevProgress = classProgress.find((p) => p.module_id === modules[modIndex - 1].id);
                  isLocked = !prevProgress || prevProgress.ready_score < 70;
                }

                return (
                  <div key={mod.id} className={`text-center p-3 rounded-xl border transition-colors ${
                    isLocked
                      ? 'bg-muted/10 border-border opacity-50'
                      : 'bg-muted/20 border-border hover:border-[#2DD4BF]/20'
                  }`}>
                    <ReadyScoreGauge score={isLocked ? 0 : score} size={80} />
                    <p className="text-[10px] text-foreground mt-2 truncate font-medium">
                      {isLocked ? <Lock className="w-3 h-3 text-muted-foreground mx-auto" /> : mod.name}
                    </p>
                    {!isLocked && (
                      <div className="flex items-center justify-center gap-3 mt-1.5 text-[9px] text-muted-foreground">
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
                      <div className="mt-1.5">
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
    </motion.div>
  );
}
