import type { RuntimeUxProfile } from "./runtime-ux-profile";

type PresentationContract = {
  readonly sections: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly description?: string;
    readonly order: number;
  }>;
  readonly fields: ReadonlyArray<{
    readonly key: string;
    readonly sectionId: string;
    readonly order: number;
  }>;
};

type PresentationProfile = Pick<
  RuntimeUxProfile,
  "sections" | "presentationSections"
>;

export type ResolvedPresentationSection = {
  readonly id: string;
  readonly contractTitle: string;
  readonly title?: string;
  readonly description?: string;
  readonly fieldKeys: ReadonlyArray<string>;
};

export type PresentationLayoutResolution = {
  readonly usesPresentationLayout: boolean;
  readonly sections: ReadonlyArray<ResolvedPresentationSection>;
};

function fallbackSections(
  contract: PresentationContract,
  profile: PresentationProfile | null | undefined,
): PresentationLayoutResolution {
  const overrides = new Map(
    (profile?.sections ?? []).map((section) => [section.sectionId, section]),
  );
  return {
    usesPresentationLayout: false,
    sections: [...contract.sections]
      .sort((left, right) => left.order - right.order)
      .map((section) => {
        const override = overrides.get(section.id);
        return {
          id: section.id,
          contractTitle: section.title,
          title: override?.title,
          description: override?.description ?? section.description,
          fieldKeys: contract.fields
            .filter((field) => field.sectionId === section.id)
            .sort((left, right) => left.order - right.order)
            .map((field) => field.key),
        };
      }),
  };
}

/**
 * Validates profile grouping before render. A malformed profile never drops or
 * remaps fields: the caller receives the original contract grouping instead.
 */
export function resolveRuntimeUxPresentationSections(
  contract: PresentationContract,
  profile: PresentationProfile | null | undefined,
): PresentationLayoutResolution {
  const layout = profile?.presentationSections;
  if (!layout || layout.length === 0) return fallbackSections(contract, profile);

  const contractKeys = new Set(contract.fields.map((field) => field.key));
  const seenLayoutIds = new Set<string>();
  const seenFieldKeys = new Set<string>();

  for (const section of layout) {
    if (!section.id.trim() || !section.title.trim() || seenLayoutIds.has(section.id)) {
      return fallbackSections(contract, profile);
    }
    seenLayoutIds.add(section.id);
    for (const fieldKey of section.fieldKeys) {
      if (!contractKeys.has(fieldKey) || seenFieldKeys.has(fieldKey)) {
        return fallbackSections(contract, profile);
      }
      seenFieldKeys.add(fieldKey);
    }
  }

  if (seenFieldKeys.size !== contractKeys.size) {
    return fallbackSections(contract, profile);
  }

  return {
    usesPresentationLayout: true,
    sections: layout.map((section) => ({
      id: section.id,
      contractTitle: section.title,
      title: section.title,
      description: section.description,
      fieldKeys: section.fieldKeys,
    })),
  };
}
