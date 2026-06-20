import type {
  FieldDefinition,
  FormContractV2,
  SectionDefinition,
  TableDefinition,
  RepeatableGroupDefinition,
} from '@qllaw/form-contracts';

export type DraftOperation =
  | { type: 'ADD_SECTION'; section: SectionDefinition }
  | {
      type: 'UPDATE_SECTION';
      sectionId: string;
      patch: Partial<Omit<SectionDefinition, 'id'>>;
    }
  | { type: 'REMOVE_SECTION'; sectionId: string }
  | { type: 'ADD_FIELD'; field: FieldDefinition }
  | {
      type: 'UPDATE_FIELD';
      fieldId: string;
      patch: Partial<Omit<FieldDefinition, 'id'>>;
    }
  | { type: 'REMOVE_FIELD'; fieldId: string }
  | {
      type: 'MOVE_FIELD';
      fieldId: string;
      sectionId: string;
      order: number;
    }
  | { type: 'ADD_REPEATER'; repeater: RepeatableGroupDefinition }
  | { type: 'REMOVE_REPEATER'; repeaterId: string }
  | { type: 'ADD_TABLE'; table: TableDefinition }
  | { type: 'REMOVE_TABLE'; tableId: string }
  | { type: 'REPLACE_CONTRACT'; contract: FormContractV2 };

function notFound(entity: string, id: string): never {
  throw new Error(`${entity} "${id}" does not exist.`);
}

export function applyDraftOperations(
  source: FormContractV2,
  operations: DraftOperation[],
): FormContractV2 {
  let contract = structuredClone(source);

  for (const operation of operations) {
    switch (operation.type) {
      case 'ADD_SECTION':
        contract.sections.push(operation.section);
        break;
      case 'UPDATE_SECTION': {
        const index = contract.sections.findIndex(
          (section) => section.id === operation.sectionId,
        );
        if (index < 0) notFound('Section', operation.sectionId);
        contract.sections[index] = {
          ...contract.sections[index],
          ...operation.patch,
          id: operation.sectionId,
        } as SectionDefinition;
        break;
      }
      case 'REMOVE_SECTION':
        contract.sections = contract.sections.filter(
          (section) => section.id !== operation.sectionId,
        );
        contract.fields = contract.fields.filter(
          (field) => field.sectionId !== operation.sectionId,
        );
        break;
      case 'ADD_FIELD':
        contract.fields.push(operation.field);
        break;
      case 'UPDATE_FIELD': {
        const index = contract.fields.findIndex(
          (field) => field.id === operation.fieldId,
        );
        if (index < 0) notFound('Field', operation.fieldId);
        contract.fields[index] = {
          ...contract.fields[index],
          ...operation.patch,
          id: operation.fieldId,
        } as FieldDefinition;
        break;
      }
      case 'REMOVE_FIELD': {
        const field = contract.fields.find(
          (candidate) => candidate.id === operation.fieldId,
        );
        if (!field) notFound('Field', operation.fieldId);
        contract.fields = contract.fields.filter(
          (candidate) => candidate.id !== operation.fieldId,
        );
        contract.renderBindings = contract.renderBindings.filter(
          (binding) =>
            !(
              binding.source.kind === 'FIELD' &&
              binding.source.fieldKey === field.key
            ),
        );
        contract.conditionalRules = contract.conditionalRules.filter(
          (rule) => rule.targetFieldKey !== field.key,
        );
        contract.validationRules = contract.validationRules.filter(
          (rule) => rule.fieldKey !== field.key,
        );
        break;
      }
      case 'MOVE_FIELD': {
        const index = contract.fields.findIndex(
          (field) => field.id === operation.fieldId,
        );
        if (index < 0) notFound('Field', operation.fieldId);
        contract.fields[index] = {
          ...contract.fields[index],
          sectionId: operation.sectionId,
          order: operation.order,
        } as FieldDefinition;
        break;
      }
      case 'ADD_REPEATER':
        contract.repeatableGroups.push(operation.repeater);
        break;
      case 'REMOVE_REPEATER':
        contract.repeatableGroups = contract.repeatableGroups.filter(
          (repeater) => repeater.id !== operation.repeaterId,
        );
        contract.fields = contract.fields.map((field) =>
          field.repeatableGroupId === operation.repeaterId
            ? { ...field, repeatableGroupId: undefined }
            : field,
        );
        break;
      case 'ADD_TABLE':
        contract.tables.push(operation.table);
        break;
      case 'REMOVE_TABLE': {
        const table = contract.tables.find(
          (candidate) => candidate.id === operation.tableId,
        );
        if (!table) notFound('Table', operation.tableId);
        contract.tables = contract.tables.filter(
          (candidate) => candidate.id !== operation.tableId,
        );
        contract.renderBindings = contract.renderBindings.filter(
          (binding) =>
            !(
              (binding.source.kind === 'TABLE' &&
                binding.source.tableKey === table.key) ||
              (binding.target.kind === 'TABLE' &&
                binding.target.tableKey === table.key)
            ),
        );
        break;
      }
      case 'REPLACE_CONTRACT':
        contract = structuredClone(operation.contract);
        break;
    }
  }

  contract.contractHash = '';
  contract.status = 'DRAFT';
  return contract;
}
