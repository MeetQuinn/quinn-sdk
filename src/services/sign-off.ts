import { AxiosInstance } from 'axios';
import {
  type CreateSignOffAssignmentInput,
  type CreateSignOffFormInput,
  type CreateSignOffFormVersionInput,
  type PagedResult,
  type RollForwardSignOffAssignmentsResult,
  type SignOffAssignment,
  type SignOffAssignmentsQuery,
  type SignOffAssignmentRuntime,
  type SignOffForm,
  type SignOffFormsQuery,
  type SignOffSubmission,
  type SignOffSubmissionsQuery,
  type UpdateSignOffFormInput,
} from '../types';
import { type QuinnMutationReceipt } from '../mutations';

export class SignOffService {
  constructor(
    private readonly http: AxiosInstance,
    private readonly assertMutationAllowed: (operation: string) => void,
    private readonly notifyMutationCommitted?: (
      receipt: QuinnMutationReceipt
    ) => Promise<void>
  ) {}

  async list(query: SignOffFormsQuery = {}): Promise<PagedResult<SignOffForm>> {
    const resp = await this.http.get<PagedResult<SignOffForm>>('/sign-offs', {
      params: {
        limit: query.limit,
        token: query.token,
        status: query.status,
      },
    });
    return resp.data;
  }

  async get(formId: string): Promise<SignOffForm | null> {
    const resp = await this.http.get<{ item: SignOffForm | null }>(
      `/sign-offs/${formId}`
    );
    return resp.data.item;
  }

  async create(input: CreateSignOffFormInput): Promise<SignOffForm> {
    this.assertMutationAllowed('signOff.create');
    const resp = await this.http.post<{ item: SignOffForm }>('/sign-offs', {
      name: input.name,
      description: input.description,
      method: input.method,
      fillOverTime: input.fillOverTime,
      initialVersion: input.initialVersion
        ? {
            inputDefs: input.initialVersion.inputDefs,
            schema: input.initialVersion.schema,
            html: input.initialVersion.html,
            changeNote: input.initialVersion.changeNote,
          }
        : undefined,
    });
    await this.notifyFormMutation('signOff.create', resp.data.item.id);
    return resp.data.item;
  }

  async update(formId: string, input: UpdateSignOffFormInput): Promise<SignOffForm> {
    this.assertMutationAllowed('signOff.update');
    const resp = await this.http.put<{ item: SignOffForm }>(`/sign-offs/${formId}`, {
      name: input.name,
      description: input.description,
      status: input.status,
      method: input.method,
      fillOverTime: input.fillOverTime,
    });
    await this.notifyFormMutation('signOff.update', formId);
    return resp.data.item;
  }

  async archive(formId: string): Promise<SignOffForm> {
    return this.update(formId, { status: 'archived' });
  }

  async createVersion(
    formId: string,
    input: CreateSignOffFormVersionInput
  ): Promise<SignOffForm['versions'][number]> {
    this.assertMutationAllowed('signOff.createVersion');
    const resp = await this.http.post<{ item: SignOffForm['versions'][number] }>(
      `/sign-offs/${formId}/versions`,
      {
        inputDefs: input.inputDefs,
        schema: input.schema,
        html: input.html,
        changeNote: input.changeNote,
      }
    );
    await this.notifyFormMutation('signOff.createVersion', formId);
    return resp.data.item;
  }

  async listAssignments(
    query: SignOffAssignmentsQuery = {}
  ): Promise<PagedResult<SignOffAssignment>> {
    const resp = await this.http.get<PagedResult<SignOffAssignment>>(
      '/sign-offs/assignments',
      {
        params: {
          formId: query.formId,
          formVersionId: query.formVersionId,
          actorRef: query.actorRef,
          status: query.status,
          limit: query.limit,
          token: query.token,
        },
      }
    );
    return resp.data;
  }

  async getAssignment(assignmentId: string): Promise<SignOffAssignment | null> {
    const resp = await this.http.get<{ item: SignOffAssignment | null }>(
      `/sign-offs/assignments/${assignmentId}`
    );
    return resp.data.item;
  }

  async getAssignmentRuntime(
    assignmentId: string
  ): Promise<SignOffAssignmentRuntime> {
    const resp = await this.http.get<{ item: SignOffAssignmentRuntime }>(
      `/sign-offs/assignments/${assignmentId}/runtime`
    );
    return resp.data.item;
  }

  async createAssignment(
    formId: string,
    input: CreateSignOffAssignmentInput
  ): Promise<SignOffAssignment> {
    this.assertMutationAllowed('signOff.createAssignment');
    const resp = await this.http.post<{ item: SignOffAssignment }>(
      `/sign-offs/${formId}/assignments`,
      {
        subjectId: input.subjectId,
        actorRef: input.actorRef,
        inputs: input.inputs,
        dueDate: input.dueDate,
      }
    );
    return resp.data.item;
  }

  async rollForwardPendingAssignments(
    formId: string
  ): Promise<RollForwardSignOffAssignmentsResult> {
    this.assertMutationAllowed('signOff.rollForwardPendingAssignments');
    const resp = await this.http.post<{ item: RollForwardSignOffAssignmentsResult }>(
      `/sign-offs/${formId}/assignments/roll-forward`
    );
    return resp.data.item;
  }

  async cancelAssignment(assignmentId: string): Promise<SignOffAssignment> {
    this.assertMutationAllowed('signOff.cancelAssignment');
    const resp = await this.http.put<{ item: SignOffAssignment }>(
      `/sign-offs/assignments/${assignmentId}/cancel`
    );
    return resp.data.item;
  }

  async listSubmissions(
    query: SignOffSubmissionsQuery = {}
  ): Promise<PagedResult<SignOffSubmission>> {
    const resp = await this.http.get<PagedResult<SignOffSubmission>>(
      '/sign-offs/submissions',
      {
        params: {
          assignmentId: query.assignmentId,
          status: query.status,
          limit: query.limit,
          token: query.token,
        },
      }
    );
    return resp.data;
  }

  async getSubmission(submissionId: string): Promise<SignOffSubmission | null> {
    const resp = await this.http.get<{ item: SignOffSubmission | null }>(
      `/sign-offs/submissions/${submissionId}`
    );
    return resp.data.item;
  }

  private async notifyFormMutation(
    operation: string,
    formId: string
  ): Promise<void> {
    await this.notifyMutationCommitted?.({
      operation,
      affectedResources: [
        {
          type: 'sign-off-form',
          id: formId,
        },
      ],
    });
  }
}
