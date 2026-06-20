import { z } from 'zod';
import {
  fieldDefinitionSchema,
  formContractV2Schema,
  repeatableGroupDefinitionSchema,
  sectionDefinitionSchema,
  tableDefinitionSchema,
} from '@qllaw/form-contracts';

const safeId = z.string().min(1).max(200);

export const draftOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ADD_SECTION'),
    section: sectionDefinitionSchema,
  }),
  z.object({
    type: z.literal('UPDATE_SECTION'),
    sectionId: safeId,
    patch: sectionDefinitionSchema.omit({ id: true }).partial(),
  }),
  z.object({ type: z.literal('REMOVE_SECTION'), sectionId: safeId }),
  z.object({ type: z.literal('ADD_FIELD'), field: fieldDefinitionSchema }),
  z.object({
    type: z.literal('UPDATE_FIELD'),
    fieldId: safeId,
    patch: fieldDefinitionSchema.omit({ id: true }).partial(),
  }),
  z.object({ type: z.literal('REMOVE_FIELD'), fieldId: safeId }),
  z.object({
    type: z.literal('MOVE_FIELD'),
    fieldId: safeId,
    sectionId: safeId,
    order: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('ADD_REPEATER'),
    repeater: repeatableGroupDefinitionSchema,
  }),
  z.object({ type: z.literal('REMOVE_REPEATER'), repeaterId: safeId }),
  z.object({ type: z.literal('ADD_TABLE'), table: tableDefinitionSchema }),
  z.object({ type: z.literal('REMOVE_TABLE'), tableId: safeId }),
  z.object({
    type: z.literal('REPLACE_CONTRACT'),
    contract: formContractV2Schema,
  }),
]);

export const draftOperationsSchema = z.array(draftOperationSchema).max(200);
