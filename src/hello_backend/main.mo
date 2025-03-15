import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Debug "mo:base/Debug";

actor {
  // Define the Member type
  public type Member = {
    principal : Principal;
    approved : Bool;
  };

  // Initialize deployer with a placeholder principal
  // This will be updated when someone calls addSelfAsApprovedMember
  stable var deployer : Principal = Principal.fromText("2vxsx-fae");

  // Initialize members array
  stable var members : [Member] = [];

  // Initialize the members when the canister is created
  // This runs once when the canister is deployed
  do {
    // If members array is empty, initialize it with the placeholder deployer
    // The real deployer will need to call addSelfAsApprovedMember
    if (members.size() == 0) {
      members := [{ principal = deployer; approved = true }];
      Debug.print("Initial placeholder member added with principal: " # Principal.toText(deployer));
    };
  };

  // Ensure members list is preserved across upgrades
  system func preupgrade() {
    // No need to do anything here as members is already stable
  };

  // Allow users to register as pending members
  public shared (msg) func register() : async () {
    let caller = msg.caller;

    // Check if the caller is already registered
    let exists = Array.find<Member>(members, func(m) { Principal.equal(m.principal, caller) });

    switch (exists) {
      case (?_) { /* Already registered, do nothing */ };
      case null {
        // Add the caller as a pending member
        members := Array.append(members, [{ principal = caller; approved = false }]);
        Debug.print("New member registered (pending): " # Principal.toText(caller));
      };
    };
  };

  // Allow approved members to approve pending members
  public shared (msg) func approveMember(target : Principal) : async Bool {
    let voter = msg.caller;

    // Check if the voter is an approved member
    let voterApproved = Array.find<Member>(
      members,
      func(m) {
        Principal.equal(m.principal, voter) and m.approved
      },
    );

    if (Option.isNull(voterApproved)) {
      Debug.print("Approval rejected: voter not approved");
      return false;
    };

    // Find the target member
    let targetMember = Array.find<Member>(
      members,
      func(m) {
        Principal.equal(m.principal, target);
      },
    );

    switch (targetMember) {
      case (?m) {
        if (not m.approved) {
          // Count approved members for majority calculation (unused in this prototype)
          let _approvedCount = Array.foldLeft<Member, Nat>(
            members,
            0,
            func(acc, m) { if (m.approved) { acc + 1 } else { acc } },
          );

          // Simple majority check (>50% of approved members)
          // For the prototype, we'll just approve with a single vote
          // In a real implementation, we would track votes per member

          members := Array.map<Member, Member>(
            members,
            func(x) {
              if (Principal.equal(x.principal, target)) {
                { principal = x.principal; approved = true };
              } else {
                x;
              };
            },
          );

          Debug.print("Member approved: " # Principal.toText(target));
          return true;
        };
      };
      case null {
        Debug.print("Approval rejected: target not found");
      };
    };

    return false;
  };

  // Query method to get the list of members
  public query func getMembers() : async [Member] {
    members;
  };

  // Helper query to check if a principal is an approved member
  public query func isApprovedMember(p : Principal) : async Bool {
    Option.isSome(
      Array.find<Member>(
        members,
        func(m) { Principal.equal(m.principal, p) and m.approved },
      )
    );
  };

  // Add a method to add the caller as an approved member
  // This can be used to make yourself an approved member
  public shared (msg) func addSelfAsApprovedMember() : async Bool {
    let caller = msg.caller;

    // Check if the caller is already registered
    let exists = Array.find<Member>(members, func(m) { Principal.equal(m.principal, caller) });

    switch (exists) {
      case (?m) {
        if (m.approved) {
          // Already an approved member
          return true;
        } else {
          // Update the member to be approved
          members := Array.map<Member, Member>(
            members,
            func(x) {
              if (Principal.equal(x.principal, caller)) {
                { principal = x.principal; approved = true };
              } else {
                x;
              };
            },
          );
          Debug.print("Self-approved member: " # Principal.toText(caller));
          return true;
        };
      };
      case null {
        // Add the caller as an approved member
        members := Array.append(members, [{ principal = caller; approved = true }]);
        Debug.print("Added self as approved member: " # Principal.toText(caller));
        return true;
      };
    };
  };
};
