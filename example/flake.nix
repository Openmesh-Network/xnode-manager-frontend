{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    xnode-manager-frontend.url = "github:Openmesh-Network/xnode-manager-frontend";
  };

  outputs =
    {
      self,
      nixpkgs,
      xnode-manager-frontend,
      ...
    }:
    let
      system = "x86_64-linux";
    in
    {
      nixosConfigurations.container = nixpkgs.lib.nixosSystem {
        inherit system;
        specialArgs = {
          inherit xnode-manager-frontend;
        };
        modules = [
          (
            { xnode-manager-frontend, ... }:
            {
              imports = [
                xnode-manager-frontend.nixosModules.default
              ];

              boot.isContainer = true;

              services.xnode-manager-frontend = {
                enable = true;
              };

              networking = {
                firewall.allowedTCPPorts = [
                  3000
                ];

                useHostResolvConf = nixpkgs.lib.mkForce false;
              };

              services.resolved.enable = true;

              system.stateVersion = "25.05";
            }
          )
        ];
      };
    };
}
