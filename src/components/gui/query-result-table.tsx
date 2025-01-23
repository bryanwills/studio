import OptimizeTable, {
  OptimizeTableHeaderWithIndexProps,
} from "@/components/gui/table-optimized";
import OptimizeTableState from "@/components/gui/table-optimized/OptimizeTableState";
import { KEY_BINDING } from "@/lib/key-matcher";
import {
  LucideChevronDown,
  LucidePin,
  LucideSortAsc,
  LucideSortDesc,
} from "lucide-react";
import React, {
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import { ColumnSortOption } from "@/drivers/base-driver";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import useTableResultContextMenu from "./table-result/context-menu";
import { cn } from "@/lib/utils";
import { useConfig } from "@/context/config-provider";

interface ResultTableProps {
  data: OptimizeTableState;
  tableName?: string;
  onSortColumnChange?: (columns: ColumnSortOption[]) => void;
  sortColumns?: ColumnSortOption[];
  visibleColumnIndexList?: number[];
}

function Header({
  children,
  header,
  internalState,
}: PropsWithChildren<{
  header: OptimizeTableHeaderWithIndexProps;
  internalState: OptimizeTableState;
}>) {
  const [open, setOpen] = useState(false);
  const colIndex = header.index;

  let textClass = "grow line-clamp-1 font-mono font-bold";
  let thClass = "flex grow items-center px-2 overflow-hidden";

  if (internalState.getSelectedColIndex().includes(colIndex)) {
    if (internalState.isFullSelectionCol(colIndex)) {
      textClass = "grow line-clamp-1 font-mono font-bold text-white font-bold";
      thClass =
        "flex grow items-center px-2 overflow-hidden bg-blue-600 dark:bg-blue-900";
    } else {
      textClass =
        "grow line-clamp-1 font-mono font-bold dark:text-white font-bold";
      thClass =
        "flex grow items-center px-2 overflow-hidden bg-blue-200 dark:bg-blue-400";
    }
  }

  return (
    <div
      className={thClass}
      onMouseDown={(e) => {
        const focusCell = internalState.getFocus();
        if (e.shiftKey && focusCell) {
          internalState.selectColRange(focusCell.x, colIndex);
        } else if (e.ctrlKey && focusCell) {
          internalState.addSelectionCol(colIndex);
          internalState.setFocus(0, colIndex);
        } else {
          internalState.selectColumn(colIndex);
          internalState.setFocus(0, colIndex);
        }
      }}
    >
      {header.display.icon ? (
        <div className="mr-2">
          <header.display.icon
            className={cn("h-4 w-4", header.display.iconClassName)}
          />
        </div>
      ) : null}
      <div className={textClass}>{header.display.text}</div>
      <DropdownMenu modal={false} onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild>
          <LucideChevronDown className="text-mute h-4 w-4 flex-shrink-0 cursor-pointer" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={"w-[300px]"}
          side="bottom"
          align="start"
          sideOffset={0}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function ResultTable({
  data,
  tableName,
  onSortColumnChange,
  visibleColumnIndexList,
}: ResultTableProps) {
  const [stickyHeaderIndex, setStickHeaderIndex] = useState<number>();

  const { extensions } = useConfig();

  const headerIndex = useMemo(() => {
    if (visibleColumnIndexList) return visibleColumnIndexList;
    return data.getHeaders().map((_, idx) => idx);
  }, [data, visibleColumnIndexList]);

  const renderHeader = useCallback(
    (header: OptimizeTableHeaderWithIndexProps) => {
      // const generatedExpression =
      //   header.headerData?.constraint?.generatedExpression;

      // const generatedInfo = generatedExpression ? (
      //   <div className="p-2">
      //     <div className="rounded bg-blue-200 p-2 text-xs text-black">
      //       <h2 className="font-semibold">Generated Expression</h2>
      //       <pre className="text-sm">
      //         <code>{generatedExpression}</code>
      //       </pre>
      //     </div>
      //   </div>
      // ) : undefined;

      const extensionMenu = extensions.getQueryHeaderContextMenu(header);
      const extensionMenuItems = extensionMenu.map((item) => {
        if (item.component) {
          return item.component;
        }

        return (
          <DropdownMenuItem key={item.key} onClick={item.onClick}>
            {item.title}
          </DropdownMenuItem>
        );
      });

      return (
        <Header header={header} internalState={data}>
          {extensionMenuItems}
          {/* 
          {foreignKeyInfo}
          {generatedInfo} */}
          <DropdownMenuItem
            onClick={() => {
              setStickHeaderIndex(
                header.index === stickyHeaderIndex ? undefined : header.index
              );
            }}
          >
            <LucidePin className="mr-2 h-4 w-4" />
            Pin Header
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!tableName}
            onClick={() => {
              if (onSortColumnChange) {
                onSortColumnChange([{ columnName: header.name, by: "ASC" }]);
              }
            }}
          >
            <LucideSortAsc className="mr-2 h-4 w-4" />
            Sort A → Z
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!tableName}
            onClick={() => {
              if (onSortColumnChange) {
                onSortColumnChange([{ columnName: header.name, by: "DESC" }]);
              }
            }}
          >
            <LucideSortDesc className="mr-2 h-4 w-4" />
            Sort Z → A
          </DropdownMenuItem>
        </Header>
      );
    },
    [data, tableName, stickyHeaderIndex, onSortColumnChange, extensions]
  );

  const onHeaderContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const copyCallback = useCallback((state: OptimizeTableState) => {
    const focus = state.getFocus();
    if (focus) {
      const y = focus.y;
      const x = focus.x;
      window.navigator.clipboard.writeText(state.getValue(y, x) as string);
    }
  }, []);

  const pasteCallback = useCallback((state: OptimizeTableState) => {
    const focus = state.getFocus();
    if (focus) {
      const y = focus.y;
      const x = focus.x;
      window.navigator.clipboard.readText().then((pasteValue) => {
        state.changeValue(y, x, pasteValue);
      });
    }
  }, []);

  const onCellContextMenu = useTableResultContextMenu({
    tableName,
    data,
    copyCallback,
    pasteCallback,
  });

  const onShiftKeyDownCallBack = useCallback(
    (state: OptimizeTableState, e: React.KeyboardEvent) => {
      const focus = state.getFocus();
      if (e.shiftKey && focus) {
        let lastMove = null;
        if (state.getLastMove()) {
          lastMove = state.getLastMove();
        } else {
          const selectedRange = state.getSelectionRange(focus.y, focus.x);
          if (selectedRange)
            lastMove = { x: selectedRange.x2, y: selectedRange.y2 };
        }

        if (lastMove) {
          const rows = state.getRowsCount();
          const cols = state.getHeaderCount();
          let newRow = lastMove.y;
          let newCol = lastMove.x;
          let horizontal: "right" | "left" = "left";
          let vertical: "top" | "bottom" = "bottom";
          if (e.key === "ArrowUp") {
            newRow = Math.max(lastMove.y - 1, 0);
            horizontal = "left";
            vertical = "top";
          }
          if (e.key === "ArrowDown") {
            horizontal = "left";
            vertical = "bottom";
            newRow = Math.min(lastMove.y + 1, rows - 1);
          }
          if (e.key === "ArrowLeft") {
            horizontal = "left";
            vertical = "top";
            newCol = Math.max(lastMove.x - 1, 0);
          }
          if (e.key === "ArrowRight") {
            horizontal = "right";
            vertical = "top";
            newCol = Math.min(lastMove.x + 1, cols - 1);
          }

          state.selectCellRange(focus.y, focus.x, newRow, newCol);
          state.setLastMove(newRow, newCol);
          state.scrollToCell(horizontal, vertical, { x: newCol, y: newRow });
        }
      }
    },
    []
  );

  const onKeyDown = useCallback(
    (state: OptimizeTableState, e: React.KeyboardEvent) => {
      if (state.isInEditMode()) return;

      if (KEY_BINDING.copy.match(e as React.KeyboardEvent<HTMLDivElement>)) {
        copyCallback(state);
      } else if (
        KEY_BINDING.paste.match(e as React.KeyboardEvent<HTMLDivElement>)
      ) {
        pasteCallback(state);
      } else if (e.key === "ArrowRight") {
        if (e.shiftKey) {
          onShiftKeyDownCallBack(state, e);
        } else {
          const focus = state.getFocus();
          if (focus && focus.x + 1 < state.getHeaderCount()) {
            state.setFocus(focus.y, focus.x + 1);
            state.scrollToCell("right", "top", { y: focus.y, x: focus.x + 1 });
          }
        }
      } else if (e.key === "ArrowLeft") {
        if (e.shiftKey) {
          onShiftKeyDownCallBack(state, e);
        } else {
          const focus = state.getFocus();
          if (focus && focus.x - 1 >= 0) {
            state.setFocus(focus.y, focus.x - 1);
            state.scrollToCell("left", "top", { y: focus.y, x: focus.x - 1 });
          }
        }
      } else if (e.key === "ArrowUp") {
        if (e.shiftKey) {
          onShiftKeyDownCallBack(state, e);
        } else {
          const focus = state.getFocus();
          if (focus && focus.y - 1 >= 0) {
            state.setFocus(focus.y - 1, focus.x);
            state.scrollToCell("left", "top", { y: focus.y - 1, x: focus.x });
          }
        }
      } else if (e.key === "ArrowDown") {
        if (e.shiftKey) {
          onShiftKeyDownCallBack(state, e);
        } else {
          const focus = state.getFocus();
          if (focus && focus.y + 1 < state.getRowsCount()) {
            state.setFocus(focus.y + 1, focus.x);
            state.scrollToCell("left", "bottom", {
              y: focus.y + 1,
              x: focus.x,
            });
          }
        }
      } else if (e.key === "Tab") {
        const focus = state.getFocus();
        if (focus) {
          const colCount = state.getHeaderCount();
          const n = focus.y * colCount + focus.x + 1;
          const x = n % colCount;
          const y = Math.floor(n / colCount);
          if (y >= state.getRowsCount()) return;
          state.setFocus(y, x);
          state.scrollToCell(x === 0 ? "left" : "right", "bottom", {
            y: y,
            x: x,
          });
        }
      } else if (e.key === "Enter") {
        state.enterEditMode();
      }

      e.preventDefault();
    },
    [copyCallback, onShiftKeyDownCallBack, pasteCallback]
  );

  return (
    <OptimizeTable
      internalState={data}
      onContextMenu={onCellContextMenu}
      onHeaderContextMenu={onHeaderContextMenu}
      stickyHeaderIndex={stickyHeaderIndex}
      arrangeHeaderIndex={headerIndex}
      renderAhead={20}
      renderHeader={renderHeader}
      rowHeight={35}
      onKeyDown={onKeyDown}
    />
  );
}
