import TriggerEditor from "../trigger-editor";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DatabaseTriggerSchema } from "@/drivers/base-driver";
import { useDatabaseDriver } from "@/context/driver-provider";
import OpacityLoading from "../loading-opacity";
import { produce } from "immer";
import { TriggerController } from "../trigger-editor/trigger-controller";

import { isEqual } from "lodash";
import { TriggerSaveDialog } from "../trigger-editor/trigger-save-dialog";

export interface TriggerTabProps {
  name: string;
  tableName?: string;
  schemaName: string;
}

const EMPTY_DEFAULT_TRIGGER: DatabaseTriggerSchema = {
  name: "",
  operation: "INSERT",
  when: "BEFORE",
  tableName: "",
  whenExpression: "",
  statement: "",
  schemaName: "",
};

export default function TriggerTab({
  name,
  schemaName,
  tableName,
}: TriggerTabProps) {
  const { databaseDriver } = useDatabaseDriver();
  const [isSaving, setIsSaving] = useState(false);

  // If name is specified, it means the trigger is already exist
  const [loading, setLoading] = useState(!!name);

  // Loading the inital value
  const [initialValue, setInitialValue] = useState<DatabaseTriggerSchema>(
    () => {
      return produce(EMPTY_DEFAULT_TRIGGER, (draft) => {
        draft.tableName = tableName ?? "";
        draft.schemaName = schemaName ?? "";
      });
    }
  );
  const [value, setValue] = useState<DatabaseTriggerSchema>(initialValue);

  const hasChanged = !isEqual(initialValue, value);

  const previewScript = useMemo(() => {
    const drop = databaseDriver.dropTrigger(value.schemaName, name);
    const create = databaseDriver.createTrigger(value);
    return name !== 'create' ? [drop, create] : [create];
  }, [value, databaseDriver, name]);

  // Loading the trigger
  useEffect(() => {
    if (name && schemaName) {
      if (name === 'create') {
        return setLoading(false)
      }
      databaseDriver
        .trigger(schemaName, name)
        .then((triggerValue) => {
          setValue(triggerValue);
          setInitialValue(triggerValue);
        })
        .finally(() => setLoading(false));
    }
  }, [name, schemaName, databaseDriver]);

  const toggleSaving = useCallback(() => {
    setIsSaving(!isSaving);
  }, [isSaving]);

  if (loading) {
    return <OpacityLoading />;
  }

  return (
    <div className="flex flex-col overflow-hidden w-full h-full">
      {
        isSaving &&
        <TriggerSaveDialog
          onClose={toggleSaving}
          previewScript={previewScript}
          trigger={value}
        />
      }
      <TriggerController
        onSave={() => {
          // @adam do something here
          toggleSaving();
        }}
        onDiscard={() => {
          setValue(initialValue);
        }}
        disabled={!hasChanged}
        previewScript={previewScript.join(';\n')}
      />

      <TriggerEditor value={value} onChange={setValue} />
    </div>
  );
}
