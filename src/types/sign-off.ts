import { PaginationQuery } from './common';

export type SignOffInputType = 'string' | 'number' | 'date' | 'boolean';

export type SignOffFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'choice'
  | 'multi_choice'
  | 'dropdown'
  | 'boolean'
  | 'file'
  | 'signature'
  | 'field_group';

export type SignOffFormStatus = 'active' | 'archived';

/** How a sign-off is completed: the learner submits evidence, or an evaluator observes them. */
export type SignOffMethod = 'evidence' | 'observation';

export type SignOffFormVersionStatus = 'published';

export type SignOffAssignmentStatus = 'pending' | 'completed' | 'cancelled';

export type SignOffSubmissionStatus = 'draft' | 'submitted' | 'rejected';

export type SignOffOptionSourceKind =
  | 'member'
  | 'location'
  | 'job_title'
  | 'learning_group'
  | 'course';

export interface SignOffOptionSource {
  kind: SignOffOptionSourceKind;
}

export interface SignOffInputDef {
  name: string;
  type: SignOffInputType;
  label: string;
}

export interface SignOffSubFieldDef {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime';
}

export interface SignOffFieldDef {
  name: string;
  type: SignOffFieldType;
  label: string;
  required?: boolean;
  options?: string[];
  optionSource?: SignOffOptionSource;
  // Lists the scalar sub-fields of a field_group form field (object_array
  // submission value), matching api-service. Only meaningful when
  // type === 'field_group'.
  subFields?: SignOffSubFieldDef[];
}

export interface SignOffFormVersion {
  id: string;
  formId: string;
  version: number;
  status: SignOffFormVersionStatus;
  publishedAt: string;
  changeNote: string | null;
  htmlS3Path: string;
  htmlUrl: string;
  inputDefs: SignOffInputDef[];
  schema: SignOffFieldDef[];
  createdAt: string;
  updatedAt: string;
}

export interface SignOffMemberSummary {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SignOffGroupSummary {
  id: string;
  name: string;
  creatorUid: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  membersCount: number;
  coursesCount: number;
}

export interface SignOffActor {
  type: string;
  id: string;
  member: SignOffMemberSummary | null;
  group: SignOffGroupSummary | null;
}

export interface SignOffForm {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  creatorId: string | null;
  creator: SignOffMemberSummary | null;
  latestVersionId: string | null;
  status: SignOffFormStatus;
  /** How it is completed. Can't change once the sign-off has been assigned. */
  method?: SignOffMethod;
  /** Filled in over time: one copy filled in over several sessions, each answer recording who set it and when. */
  fillOverTime?: boolean;
  createdAt: string;
  updatedAt: string;
  latestVersion: SignOffFormVersion | null;
  versions: SignOffFormVersion[];
}

export interface SignOffAssignment {
  id: string;
  formId: string;
  formVersionId: string;
  orgId: string;
  subjectId: string | null;
  subject: SignOffMemberSummary | null;
  actorRef: string;
  actor: SignOffActor | null;
  inputs: Record<string, unknown>;
  assignedBy: string | null;
  dueDate: string | null;
  status: SignOffAssignmentStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface SignOffSubmission {
  id: string;
  assignmentId: string;
  formVersionId: string;
  orgId: string;
  subjectId: string | null;
  subject: SignOffMemberSummary | null;
  submitterId: string;
  submitter: SignOffMemberSummary | null;
  inputs: Record<string, unknown>;
  values: Record<string, unknown>;
  status: SignOffSubmissionStatus;
  createdAt: string;
  updatedAt: string;
  savedAt: string | null;
  submittedAt: string | null;
}

export interface SignOffAssignmentRuntime {
  assignment: SignOffAssignment;
  form: SignOffForm;
  version: SignOffFormVersion;
  draft: SignOffSubmission | null;
}

export interface SignOffAssignmentRollForwardSkip {
  assignmentId: string;
  fromVersionId: string;
  targetVersionId: string;
  reason: string;
}

export interface RollForwardSignOffAssignmentsResult {
  formId: string;
  targetVersionId: string;
  updatedAssignments: SignOffAssignment[];
  skippedAssignments: SignOffAssignmentRollForwardSkip[];
}

export interface SignOffFormsQuery extends PaginationQuery {
  status?: SignOffFormStatus;
}

export interface SignOffAssignmentsQuery extends PaginationQuery {
  formId?: string;
  formVersionId?: string;
  actorRef?: string;
  status?: SignOffAssignmentStatus;
}

export interface SignOffSubmissionsQuery extends PaginationQuery {
  assignmentId?: string;
  status?: SignOffSubmissionStatus;
}

export interface CreateSignOffFormInput {
  name: string;
  description?: string | null;
  /** Defaults to 'evidence'. */
  method?: SignOffMethod;
  fillOverTime?: boolean;
  initialVersion?: {
    inputDefs: SignOffInputDef[];
    schema: SignOffFieldDef[];
    html: string;
    changeNote?: string | null;
  };
}

export interface UpdateSignOffFormInput {
  name?: string | null;
  description?: string | null;
  status?: SignOffFormStatus;
  /** Only until the sign-off has been assigned. */
  method?: SignOffMethod;
  fillOverTime?: boolean;
}

export interface CreateSignOffFormVersionInput {
  inputDefs: SignOffInputDef[];
  schema: SignOffFieldDef[];
  html: string;
  changeNote?: string | null;
}

export interface CreateSignOffAssignmentInput {
  subjectId?: string | null;
  actorRef: string;
  inputs: Record<string, unknown>;
  dueDate?: string | null;
}
