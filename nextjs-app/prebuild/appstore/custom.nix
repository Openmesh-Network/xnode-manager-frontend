{
  inputs = {
    xnode-manager.url = "github:Openmesh-Network/xnode-manager";
    # my-app.url = "github:owner/repo/branch";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable"; # nixpkgs.follows = "my-app/nixpkgs";
  };

  outputs = inputs: {
    nixosConfigurations.container = inputs.nixpkgs.lib.nixosSystem {
      specialArgs = {
        inherit inputs;
      };
      modules = [
        inputs.xnode-manager.nixosModules.container
        # inputs.near-app.nixosModules.default
        {
          networking.hostName = "my-app";
          nixpkgs.hostPlatform = "x86_64-linux";
          system.stateVersion = "25.11";

          # services.my-app.enable = true;
        }
      ];
    };
  };
}
