import { ValidationError } from "./errors";
import { getDb } from "../config/database";

export class Validator {
  static async validateField(
    tableName: string,
    fieldName: string,
    value: any
  ): Promise<void> {
    try {
      const db = getDb();
      const [rules] = (await db.execute(
        "SELECT rule_type, rule_value FROM validation_rules WHERE table_name = ? AND field_name = ?",
        [tableName, fieldName]
      )) as [any[], any];

      if (!rules || rules.length === 0) {
        return;
      }

      const rule = rules[0];
      const ruleValue = JSON.parse(rule.rule_value);

      switch (rule.rule_type) {
        case "required":
          if (!value) {
            throw new ValidationError(`${fieldName} is required`);
          }
          break;

        case "min_length":
          if (value.length < ruleValue.min) {
            throw new ValidationError(
              `${fieldName} must be at least ${ruleValue.min} characters`
            );
          }
          break;

        case "max_length":
          if (value.length > ruleValue.max) {
            throw new ValidationError(
              `${fieldName} must be at most ${ruleValue.max} characters`
            );
          }
          break;

        case "pattern":
          if (!new RegExp(ruleValue.pattern).test(value)) {
            throw new ValidationError(
              `${fieldName} must match pattern ${ruleValue.pattern}`
            );
          }
          break;

        case "enum":
          if (!ruleValue.values.includes(value)) {
            throw new ValidationError(
              `${fieldName} must be one of: ${ruleValue.values.join(", ")}`
            );
          }
          break;

        case "range":
          if (value < ruleValue.min || value > ruleValue.max) {
            throw new ValidationError(
              `${fieldName} must be between ${ruleValue.min} and ${ruleValue.max}`
            );
          }
          break;

        default:
          console.warn(`Unknown validation rule type: ${rule.rule_type}`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error("Validation error:", error);
      throw new ValidationError(`Failed to validate ${fieldName}`);
    }
  }

  static async validateObject(
    tableName: string,
    data: Record<string, any>
  ): Promise<void> {
    const validationPromises = Object.entries(data).map(([field, value]) =>
      this.validateField(tableName, field, value)
    );

    await Promise.all(validationPromises);
  }
}
