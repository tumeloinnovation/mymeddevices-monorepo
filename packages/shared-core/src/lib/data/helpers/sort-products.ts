import { Product } from "../types";

export function sortProducts(
  products: Product[],
  orderby: "date" | "price" | "rating" | "popularity" | "title" | undefined,
  order: "asc" | "desc" | undefined = "desc"
): Product[] {
  const sorted = [...products];

  sorted.sort((a, b) => {
    let comparison = 0;
    switch (orderby) {
      case "price":
        comparison = parseFloat(a.price) - parseFloat(b.price);
        break;
      case "rating":
        comparison = parseFloat(a.average_rating) - parseFloat(b.average_rating);
        break;
      case "popularity":
        comparison = a.total_sales - b.total_sales;
        break;
      case "title":
        comparison = a.name.localeCompare(b.name);
        break;
      case "date":
      default:
        comparison = new Date(a.date_created).getTime() - new Date(b.date_created).getTime();
        break;
    }

    return order === "asc" ? comparison : -comparison;
  });

  return sorted;
}
