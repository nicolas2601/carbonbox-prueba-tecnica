import { Either } from "../../../shared/domain/Either";
import { InvalidActivityDataError } from "../errors/InvalidActivityDataError";

export interface ActivityDataProps {
  id: string;
  uploadId: string;
  category: string;
  amount: number;
  unit: string;
  date: Date;
}

export class ActivityData {
  private constructor(private readonly props: ActivityDataProps) {}
  static create(props: ActivityDataProps): Either<InvalidActivityDataError, ActivityData> {
    if (!props.category.trim()) return Either.left(new InvalidActivityDataError("category", "Must not be empty"));
    if (!props.unit.trim()) return Either.left(new InvalidActivityDataError("unit", "Must not be empty"));
    if (!Number.isFinite(props.amount) || props.amount <= 0) {
      return Either.left(new InvalidActivityDataError("amount", "Must be a finite positive number"));
    }
    if (!Number.isFinite(props.date.getTime())) return Either.left(new InvalidActivityDataError("date", "Must be a valid date"));
    return Either.right(new ActivityData({ ...props, category: props.category.trim(), unit: props.unit.trim() }));
  }
  get id(): string { return this.props.id; }
  get uploadId(): string { return this.props.uploadId; }
  get category(): string { return this.props.category; }
  get amount(): number { return this.props.amount; }
  get unit(): string { return this.props.unit; }
  get date(): Date { return this.props.date; }
}
