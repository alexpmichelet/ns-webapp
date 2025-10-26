'use client'

import { create } from 'zustand'

export type SelectedProject = {
  id: string
  name: string
}

type SelectedProjectState = {
  selectedProject: SelectedProject | null
  setSelectedProject: (project: SelectedProject | null) => void
}

export const useSelectedProjectStore = create<SelectedProjectState>((set) => ({
  selectedProject: null,
  setSelectedProject: (project) => set({ selectedProject: project }),
}))
