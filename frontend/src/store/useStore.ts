import { create } from 'zustand';

export interface IQuestion {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  answerKey?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAssignment {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  questionTypes: string[];
  numberOfQuestions: number;
  marksPerQuestion: number;
  totalMarks: number;
  additionalInstructions?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  sections: ISection[];
  pdfPath?: string;
  createdAt: string;
}

interface JobProgress {
  assignmentId: string;
  step: number;
  totalSteps: number;
  log: string;
}

interface StoreState {
  assignments: IAssignment[];
  activeAssignment: IAssignment | null;
  isLoading: boolean;
  creationLogs: string[];
  activeJobProgress: JobProgress | null;
  socket: WebSocket | null;
  
  fetchAssignments: () => Promise<void>;
  fetchAssignmentById: (id: string) => Promise<IAssignment | null>;
  createAssignment: (params: any) => Promise<IAssignment | null>;
  deleteAssignment: (id: string) => Promise<void>;
  regenerateEntireAssignment: (id: string) => Promise<void>;
  regenerateQuestion: (assignmentId: string, questionId: string) => Promise<void>;
  updateQuestionInline: (assignmentId: string, questionId: string, updates: Partial<IQuestion>) => Promise<void>;
  recompilePDF: (assignmentId: string, schoolName?: string, examTerm?: string) => Promise<void>;
  initWebSocket: () => void;
  clearCreationLogs: () => void;
}

const isClient = typeof window !== 'undefined';
const getEndpoints = () => {
  if (!isClient) {
    return { API_BASE: 'http://localhost:5000/api', WS_BASE: 'ws://localhost:5000' };
  }
  const host = window.location.host;
  const protocol = window.location.protocol;
  const isStandaloneDev = window.location.port === '3000';
  
  return {
    API_BASE: isStandaloneDev ? 'http://localhost:5000/api' : `${protocol}//${host}/api`,
    WS_BASE: isStandaloneDev ? 'ws://localhost:5000' : `${protocol === 'https:' ? 'wss:' : 'ws:'}//${host}`
  };
};

const { API_BASE, WS_BASE } = getEndpoints();

export const useStore = create<StoreState>((set, get) => ({
  assignments: [],
  activeAssignment: null,
  isLoading: false,
  creationLogs: [],
  activeJobProgress: null,
  socket: null,

  fetchAssignments: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/assignments`);
      const data = await res.json();
      set({ assignments: Array.isArray(data) ? data : [] });
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAssignmentById: async (id) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/assignments/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      set({ activeAssignment: data });
      return data;
    } catch (err) {
      console.error('Error fetching assignment details:', err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  createAssignment: async (params) => {
    set({ isLoading: true, creationLogs: [] });
    try {
      const res = await fetch(`${API_BASE}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit form.');
      }
      const data = await res.json();
      
      // Optimistically append
      set((state) => ({ 
        assignments: [data, ...state.assignments],
        creationLogs: ['✅ Form submitted successfully. Assessment job queued.']
      }));
      return data;
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      alert(err.message || 'Error occurred while creating.');
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAssignment: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/assignments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        set((state) => ({
          assignments: state.assignments.filter((a) => a._id !== id),
          activeAssignment: state.activeAssignment?._id === id ? null : state.activeAssignment
        }));
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  },

  regenerateEntireAssignment: async (id) => {
    set({ creationLogs: ['🔄 Initiating total assessment regeneration...'] });
    try {
      const res = await fetch(`${API_BASE}/assignments/${id}/regenerate`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          assignments: state.assignments.map((a) => a._id === id ? updated : a),
          activeAssignment: state.activeAssignment?._id === id ? updated : state.activeAssignment
        }));
      }
    } catch (err) {
      console.error('Error regenerating entire paper:', err);
    }
  },

  regenerateQuestion: async (assignmentId, questionId) => {
    try {
      const res = await fetch(`${API_BASE}/assignments/${assignmentId}/questions/${questionId}/regenerate`, {
        method: 'POST'
      });
      if (res.ok) {
        const updated = await res.json();
        set({ activeAssignment: updated });
        // Update assignments list too
        set((state) => ({
          assignments: state.assignments.map((a) => a._id === assignmentId ? updated : a)
        }));
      }
    } catch (err) {
      console.error('Failed to regenerate question:', err);
    }
  },

  updateQuestionInline: async (assignmentId, questionId, updates) => {
    try {
      // Optimistic update
      const active = get().activeAssignment;
      if (active && active._id === assignmentId) {
        const updatedSections = active.sections.map((sec) => ({
          ...sec,
          questions: sec.questions.map((q) => q.id === questionId ? { ...q, ...updates } : q)
        }));
        set({
          activeAssignment: { ...active, sections: updatedSections }
        });
      }

      const res = await fetch(`${API_BASE}/assignments/${assignmentId}/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        const fresh = await res.json();
        set({ activeAssignment: fresh });
        set((state) => ({
          assignments: state.assignments.map((a) => a._id === assignmentId ? fresh : a)
        }));
      }
    } catch (err) {
      console.error('Error updating question inline:', err);
    }
  },

  recompilePDF: async (assignmentId, schoolName, examTerm) => {
    try {
      await fetch(`${API_BASE}/assignments/${assignmentId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName, examTerm })
      });
    } catch (err) {
      console.error('Failed PDF compilation:', err);
    }
  },

  initWebSocket: () => {
    // Return if already connected
    if (get().socket) return;

    console.log('📡 Zustand Store: Connecting to WebSocket at', WS_BASE);
    const ws = new WebSocket(WS_BASE);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload.type === 'JOB_PROGRESS') {
          const { assignmentId, step, totalSteps, log } = payload.data;
          
          set((state) => ({
            creationLogs: [...state.creationLogs, log],
            activeJobProgress: { assignmentId, step, totalSteps, log }
          }));
        }

        if (payload.type === 'ASSIGNMENT_UPDATED') {
          const { assignmentId, status, pdfPath } = payload.data;
          
          // Re-fetch assignments list and details if current
          get().fetchAssignments();
          
          const currentActive = get().activeAssignment;
          if (currentActive && currentActive._id === assignmentId) {
            get().fetchAssignmentById(assignmentId);
          }
        }
      } catch (err) {
        console.error('Error parsing WS event:', err);
      }
    };

    ws.onclose = () => {
      console.log('📡 WebSocket disconnected. Retrying in 5 seconds...');
      set({ socket: null });
      setTimeout(() => get().initWebSocket(), 5000);
    };

    set({ socket: ws });
  },

  clearCreationLogs: () => set({ creationLogs: [], activeJobProgress: null })
}));
