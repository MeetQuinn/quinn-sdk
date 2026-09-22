import { CourseType, MediaRef, PaginationQuery } from './common';
import { AssignmentDueConfig } from './assignments';

export interface CoursesListQuery extends PaginationQuery {
  search?: string;
}

export interface Course {
  id: string;
  name: string;
  /** Stored course explainer shown in the course details UI; null when absent. */
  description: string | null;
  courseType: CourseType | null;
  creatorUid: string;
  learnerCount: number;
  cover: MediaRef | null;
  tagNames: string[];
  containingProgramIds: string[];
  isDraft: boolean;
  createdAt: string;
}

export interface CourseAssignedGroup {
  groupId: string;
  groupName: string;
  membersCount: number;
  assignedBy: string;
  assignedAt: string;
}

export interface CourseAssignedMember {
  userId: string;
  name: string;
  email: string;
  groupNames: string[];
  assignedAt: string;
  dueDate: string | null;
  addedBy: string;
  progressPct: number | null;
  assignedDirectly: boolean;
  assignedViaProgram: boolean;
}

export interface CoursesAssignToUsersInput {
  courseId: string;
  userIds: string[];
  dueDateConfig?: AssignmentDueConfig;
}

export interface CoursesAssignToGroupsInput {
  courseId: string;
  groupIds: string[];
  dueDateConfig?: AssignmentDueConfig;
}

export interface CoursesUnassignFromUserInput {
  courseId: string;
  userId: string;
}

export interface CoursesUnassignFromGroupInput {
  courseId: string;
  groupId: string;
}
