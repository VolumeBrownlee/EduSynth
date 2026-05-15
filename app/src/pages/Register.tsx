import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Eye, EyeOff, GraduationCap, Loader2, CheckCircle } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    registrationId: '',
    tenantCode: '',
    role: 'student', // Default
    adminSecret: ''  // New field
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    setIsLoading(true);

    try {
      // Map frontend 'lecturer' to backend 'teacher'
      const backendRole = formData.role === 'lecturer' ? 'teacher' : formData.role;
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        registrationId: formData.registrationId,
        tenantCode: formData.tenantCode,
        role: backendRole,
        adminSecret: formData.adminSecret,
      } as any);
      navigate('/dashboard');
    } catch (error) {
      // Error handled by auth context
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md glass-card relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Join EduSynth and start your learning journey
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Progress Steps */}
          <div className="flex justify-center mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 text-sm font-medium transition-colors ${
                  s === step
                    ? 'bg-cyan-500 text-white'
                    : s < step
                    ? 'bg-cyan-500/30 text-cyan-400'
                    : 'bg-white/10 text-muted-foreground'
                }`}
              >
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="glass-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="glass-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="glass-input"
                  />
                </div>
                <Button type="button" onClick={nextStep} className="w-full gradient-button">
                  Continue
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="glass-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="glass-input"
                  />
                  {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button type="button" onClick={prevStep} variant="outline" className="flex-1 glass-button">
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep} className="flex-1 gradient-button">
                    Continue
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="registrationId">Registration ID</Label>
                  <Input
                    id="registrationId"
                    name="registrationId"
                    placeholder="e.g., STU2024001"
                    value={formData.registrationId}
                    onChange={handleChange}
                    required
                    className="glass-input"
                  />
                </div>
                <div className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="role">I am a...</Label>
    <div className="grid grid-cols-2 gap-3">
      {[
        { value: 'student', label: 'Student', desc: 'Learn and grow', icon: '🎓' },
        { value: 'lecturer', label: 'Lecturer', desc: 'Teach and upload', icon: '👨‍🏫' },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, role: option.value }))}
          className={`p-3 rounded-xl border text-left transition-all ${
            formData.role === option.value
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
              : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'
          }`}
        >
          <div className="text-xl mb-1">{option.icon}</div>
          <div className="text-sm font-medium">{option.label}</div>
          <div className="text-[10px] opacity-70">{option.desc}</div>
        </button>
      ))}
    </div>
  </div>
</div>
                <div className="space-y-2">
                  <Label htmlFor="tenantCode">Organization Code</Label>
                  <Input
                    id="tenantCode"
                    name="tenantCode"
                    placeholder="e.g., EDUSYNTH"
                    value={formData.tenantCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, tenantCode: e.target.value.toUpperCase() }))}
                    required
                    className="glass-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use <span className="text-cyan-400 font-mono">EDUSYNTH</span> for the demo
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button type="button" onClick={prevStep} variant="outline" className="flex-1 glass-button">
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 gradient-button"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
