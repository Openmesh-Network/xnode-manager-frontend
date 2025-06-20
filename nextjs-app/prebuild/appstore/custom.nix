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
        {
          services.xnode-container.xnode-config = {
            host-platform = ./xnode-config/host-platform;
            state-version = ./xnode-config/state-version;
            hostname = ./xnode-config/hostname;
          };
        }
        # inputs.near-app.nixosModules.default
        (args: {
          # services.my-app.enable = true;
        })
      ];
    };
  };
}
