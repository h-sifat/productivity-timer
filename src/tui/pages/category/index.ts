import { CategoryFields } from "entities/category/category";

export const allCategories: CategoryFields[] = [
  { createdAt: 234234234, id: "1", name: "Study" },
  {
    createdAt: 234234234,
    id: "2",
    name: "Academic",
    parentId: "1",
    description: "Academic studies.",
  },
  { createdAt: 234234234, id: "3", name: "Math", parentId: "2" },
  { createdAt: 234234234, id: "4", name: "English", parentId: "2" },

  { createdAt: 234234234, id: "5", name: "Programming", parentId: "1" },

  { createdAt: 234234234, id: "6", name: "DSA", parentId: "5" },
  { createdAt: 234234234, id: "7", name: "Number Theory", parentId: "5" },
  { createdAt: 234234234, id: "8", name: "Backend", parentId: "5" },

  { createdAt: 234234234, id: "9", name: "Node.Js", parentId: "8" },
  { createdAt: 234234234, id: "10", name: "Sqlite", parentId: "8" },

  { createdAt: 234234234, id: "11", name: "Work" },
  { createdAt: 234234234, id: "12", name: "Personal Projects", parentId: "11" },
  { createdAt: 234234234, id: "13", name: "Job", parentId: "11" },
] as any;
