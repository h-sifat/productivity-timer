import { Form } from "tui/components/form";
import { Page } from "tui/components/page";
import { CategoryTreeComponent, OnSelect } from "./category-tree";
import { unixMsTimestampToUsLocaleDateString } from "common/util/date-time";

import type { Alert } from "tui/components/alert";
import type { Debug, Message } from "tui/interface";
import type CategoryService from "client/services/category";
import type { CategoryFields } from "entities/category/category";

export interface createCategoryPage_Argument {
  alert: Alert;
  debug: Debug;
  renderScreen(): void;
  categoryService: CategoryService;
  prompt(message: string): Promise<boolean>;
}

export function createCategoryPage(arg: createCategoryPage_Argument) {
  const { debug, renderScreen } = arg;
  const formFields = Object.freeze([
    "id",
    "name",
    "parentId",
    "createdAt",
    "description",
  ]);

  /*
   * After updating a category, I want to show the message
   * "successfully edited ...". But the problem is, as soon as a category gets
   * updated all the categories are refetched and reloaded in the tree with the
   * loadCategories function. So, immediately replaces my message with the
   * default form message. That's why I'm storing the message in this variable
   * and resetting it to undefined after reload.
   * */
  let formMessage: Message | undefined;

  // --------------------- Components ----------------------------------
  const categoryForm = new Form<CategoryFields>({
    border: true,
    renderScreen,
    position: { bottom: 0 },
    fields: formFields as any,
    disabled: ["id", "hash", "createdAt"],
    initialMessage: { text: "Create a new category.", type: "normal" },
  });

  const formHeight = Form.calculateHeight({
    border: true,
    fieldsCount: formFields.length,
  });

  const categoryTreeComponent = new CategoryTreeComponent({
    debug,
    renderScreen,
    dimension: { height: `100%-${formHeight - 1}` },
    additionalInstructions: { "shift-a": "add new", "shift-d": "delete" },
  });

  const categoryPage = new Page({
    top: 1,
    debug,
    children: [categoryTreeComponent.element, categoryForm.element],
  });

  // ----------------- Category Tree Event Handling ------------------------
  function handleCategoryChange({ category }: Parameters<OnSelect>[0]) {
    if (category) {
      categoryForm.update({
        formLabel: `[${category.name}]`,
        object: formatCategoryForForm(category),
        message: formMessage
          ? formMessage
          : { text: "Edit and submit to update.", type: "info" },
      });

      formMessage = undefined;
      return;
    }

    categoryForm.update({
      object: null,
      formLabel: `[New]`,
      message: { text: "Create a new category", type: "info" },
    });
  }

  categoryTreeComponent.onCursorMove = handleCategoryChange;
  categoryTreeComponent.onSelect = (arg) => {
    handleCategoryChange(arg);
    categoryForm.element.focus();
    renderScreen();
  };

  categoryTreeComponent.element.key("S-a", () => {
    const selectedCategory = categoryTreeComponent.selected;

    const formCategory = selectedCategory
      ? { parentId: selectedCategory.id }
      : null;

    handleCategoryChange({ category: formCategory } as any);
    categoryForm.element.focus();
    renderScreen();
  });

  categoryTreeComponent.element.key("S-d", async () => {
    const selectedCategory = categoryTreeComponent.selected;
    if (!selectedCategory) return;

    const { name, id } = selectedCategory;

    const message = `Are you sure you want to delete category "${name}" (${id})? All of it's sub-categories and work sessions will be deleted too!`;
    const shouldDelete = await arg.prompt(message);

    try {
      if (shouldDelete) await arg.categoryService.delete({ id });
    } catch (ex) {
      arg.alert({ text: ex.message, type: "error" });
    }
  });

  // ----------------- Category Form Event Handling ------------------------
  categoryForm.onSubmit = async ({ object: category }) => {
    const filteredChanges = ["name", "parentId", "description"].reduce(
      (filtered, property) => {
        const value: string = (<any>category)[property];
        if (value.length) filtered[property] = value;
        return filtered;
      },
      {} as any
    );

    try {
      if (category.id) {
        const editedCategory = await arg.categoryService.edit({
          id: category.id,
          changes: filteredChanges,
        });

        formMessage = {
          type: "success",
          text: `Successfully edited category "${editedCategory.name}"`,
        };
      } else await arg.categoryService.add(filteredChanges as any);
    } catch (ex) {
      categoryForm.updateMessage({ text: ex.message, type: "error" });
    }
  };

  // --------------------- Other --------------------------
  function loadCategories(categories: CategoryFields[]) {
    categoryTreeComponent.categories = categories;
  }

  return Object.freeze({
    loadCategories,
    form: categoryForm,
    page: categoryPage,
    tree: categoryTreeComponent,
  });
}

// -------- Utility Functions ------------------------------------
function formatCategoryForForm(category: CategoryFields) {
  let formatted: any = { ...category };

  if (category.createdAt)
    formatted.createdAt = unixMsTimestampToUsLocaleDateString(
      category.createdAt
    );

  return formatted;
}
